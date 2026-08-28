use anyhow::{Context, Result, anyhow, bail};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, ExitStatus, Stdio};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

pub const TEMPLATE: &str = r#"# Keep this file outside disposable worktrees.
version = 1
lease_minutes = 15

[[secrets]]
name = "DATABASE_URL"
source = "keychain://my-app/database-url"
labels = ["development"]

[[secrets]]
name = "NPM_TOKEN"
source = "op://Development/npm/token"
labels = ["development"]
"#;

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Config {
    pub version: u8,
    #[serde(default = "default_lease")]
    pub lease_minutes: u64,
    #[serde(default)]
    pub secrets: Vec<Secret>,
    #[serde(default)]
    pub process: ProcessPolicy,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ProcessPolicy {
    #[serde(default)]
    pub inherit: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Secret {
    pub name: String,
    pub source: String,
    #[serde(default)]
    pub labels: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct CheckReport {
    pub valid: bool,
    pub secret_names: Vec<String>,
    pub providers: Vec<String>,
    pub lease_minutes: u64,
}

#[derive(Debug, Clone, Serialize)]
pub struct Receipt {
    pub lease_id: String,
    pub worktree: String,
    pub secret_names: Vec<String>,
    pub started_at_unix: u64,
    pub expires_at_unix: u64,
    pub revoked_at_unix: u64,
    pub outcome: String,
    pub child_exit_code: Option<i32>,
}

#[derive(Debug, Clone)]
enum Source {
    Keychain { service: String, account: String },
    OnePassword(String),
}

fn default_lease() -> u64 {
    15
}

pub fn load_config(path: &Path) -> Result<Config> {
    let raw = fs::read_to_string(path)
        .with_context(|| format!("could not read config at {}", path.display()))?;
    toml::from_str(&raw).with_context(|| {
        format!(
            "could not parse {}. Fix the TOML and run check again",
            path.display()
        )
    })
}

pub fn validate(config: &Config, allow_production: bool) -> Result<CheckReport> {
    if config.version != 1 {
        bail!("config version must be 1");
    }
    if !(1..=1_440).contains(&config.lease_minutes) {
        bail!("lease_minutes must be between 1 and 1440");
    }
    if config.secrets.is_empty() {
        bail!("no secrets are approved. Add one [[secrets]] entry, then run check again");
    }

    let mut names = BTreeSet::new();
    let mut providers = BTreeSet::new();
    for secret in &config.secrets {
        validate_env_name(&secret.name)?;
        if !names.insert(secret.name.clone()) {
            bail!("{} is approved more than once. Keep one entry", secret.name);
        }
        if !allow_production
            && secret
                .labels
                .iter()
                .any(|label| matches!(label.to_ascii_lowercase().as_str(), "prod" | "production"))
        {
            bail!(
                "{} is labelled production and is denied by default",
                secret.name
            );
        }
        match parse_source(&secret.source)? {
            Source::Keychain { .. } => {
                providers.insert("os-keychain".to_string());
            }
            Source::OnePassword(_) => {
                providers.insert("1password".to_string());
            }
        }
    }
    for name in &config.process.inherit {
        validate_env_name(name)?;
    }

    Ok(CheckReport {
        valid: true,
        secret_names: names.into_iter().collect(),
        providers: providers.into_iter().collect(),
        lease_minutes: config.lease_minutes,
    })
}

fn validate_env_name(name: &str) -> Result<()> {
    let mut chars = name.chars();
    let first = chars
        .next()
        .ok_or_else(|| anyhow!("a secret name is empty"))?;
    if !(first == '_' || first.is_ascii_alphabetic())
        || !chars.all(|c| c == '_' || c.is_ascii_alphanumeric())
    {
        bail!("{name} is not a valid environment variable name");
    }
    Ok(())
}

fn parse_source(raw: &str) -> Result<Source> {
    if let Some(rest) = raw.strip_prefix("keychain://") {
        let (service, account) = rest
            .split_once('/')
            .ok_or_else(|| anyhow!("keychain reference must be keychain://SERVICE/ACCOUNT"))?;
        if service.is_empty() || account.is_empty() || account.contains(['?', '#']) {
            bail!("keychain reference must have a non-empty service and account");
        }
        return Ok(Source::Keychain {
            service: service.into(),
            account: account.into(),
        });
    }
    if raw.starts_with("op://") && raw.len() > 5 {
        return Ok(Source::OnePassword(raw.into()));
    }
    bail!("unsupported source reference. Use keychain:// or op://");
}

fn command_exists(name: &str) -> bool {
    env::var_os("PATH")
        .is_some_and(|paths| env::split_paths(&paths).any(|dir| dir.join(name).is_file()))
}

pub fn check_providers(config: &Config) -> Result<()> {
    for secret in &config.secrets {
        match parse_source(&secret.source)? {
            Source::Keychain { .. } => {
                let tool = if cfg!(target_os = "macos") {
                    "security"
                } else {
                    "secret-tool"
                };
                if !command_exists(tool) {
                    bail!(
                        "{tool} is not installed. Install the OS keychain CLI, then run check again"
                    );
                }
            }
            Source::OnePassword(_) if !command_exists("op") => {
                bail!(
                    "op is not installed. Install and sign in to 1Password CLI, then run check again"
                );
            }
            _ => {}
        }
    }
    Ok(())
}

fn resolve(secret: &Secret) -> Result<String> {
    let output = match parse_source(&secret.source)? {
        Source::Keychain { service, account } if cfg!(target_os = "macos") => {
            Command::new("security")
                .args([
                    "find-generic-password",
                    "-s",
                    &service,
                    "-a",
                    &account,
                    "-w",
                ])
                .stdin(Stdio::null())
                .stderr(Stdio::null())
                .output()
        }
        Source::Keychain { service, account } => Command::new("secret-tool")
            .args(["lookup", "service", &service, "account", &account])
            .stdin(Stdio::null())
            .stderr(Stdio::null())
            .output(),
        Source::OnePassword(reference) => Command::new("op")
            .args(["read", &reference, "--no-newline"])
            .stdin(Stdio::null())
            .stderr(Stdio::null())
            .output(),
    }
    .with_context(|| format!("could not start the provider for {}", secret.name))?;

    if !output.status.success() {
        bail!(
            "the provider could not resolve {}. Check its reference and sign-in state",
            secret.name
        );
    }
    let value = String::from_utf8(output.stdout)
        .with_context(|| format!("the provider returned non-text data for {}", secret.name))?;
    let value = value.trim_end_matches(['\r', '\n']).to_string();
    if value.is_empty() {
        bail!("the provider returned an empty value for {}", secret.name);
    }
    Ok(value)
}

pub fn verify_worktree(path: &Path) -> Result<PathBuf> {
    let canonical = path
        .canonicalize()
        .with_context(|| format!("worktree {} does not exist", path.display()))?;
    let output = Command::new("git")
        .args([
            "-C",
            canonical.to_str().unwrap_or(""),
            "rev-parse",
            "--show-toplevel",
        ])
        .stderr(Stdio::null())
        .output()
        .context("could not start git")?;
    if !output.status.success() {
        bail!("{} is not a Git worktree", canonical.display());
    }
    let top = PathBuf::from(String::from_utf8_lossy(&output.stdout).trim());
    let top = top
        .canonicalize()
        .context("git returned an unreadable worktree path")?;
    if top != canonical {
        bail!("name the worktree root, not a directory inside it");
    }
    Ok(canonical)
}

const SAFE_ENV: &[&str] = &[
    "PATH",
    "HOME",
    "USER",
    "LOGNAME",
    "SHELL",
    "TMPDIR",
    "TEMP",
    "TMP",
    "LANG",
    "LC_ALL",
    "TERM",
    "COLORTERM",
    "CI",
    "NO_COLOR",
    "SYSTEMROOT",
];

pub fn run_lease(
    config: &Config,
    worktree: &Path,
    command: &[String],
    ttl_minutes: Option<u64>,
    ttl_seconds: Option<u64>,
    allow_production: bool,
) -> Result<(Receipt, ExitStatus)> {
    let report = validate(config, allow_production)?;
    check_providers(config)?;
    let worktree = verify_worktree(worktree)?;
    if command.is_empty() {
        bail!("no child command was given. Add -- COMMAND [ARGS]");
    }
    let ttl = ttl_minutes.unwrap_or(config.lease_minutes);
    if !(1..=1_440).contains(&ttl) {
        bail!("ttl must be between 1 and 1440 minutes");
    }
    let duration_seconds = ttl_seconds.unwrap_or_else(|| ttl.saturating_mul(60));
    if !(1..=86_400).contains(&duration_seconds) {
        bail!("ttl_seconds must be between 1 and 86400");
    }

    let mut values = BTreeMap::new();
    for secret in &config.secrets {
        values.insert(secret.name.clone(), resolve(secret)?);
    }

    let started = unix_now();
    let expires = started.saturating_add(duration_seconds);
    let mut child_command = Command::new(&command[0]);
    child_command
        .args(&command[1..])
        .current_dir(&worktree)
        .env_clear();
    for name in SAFE_ENV
        .iter()
        .copied()
        .chain(config.process.inherit.iter().map(String::as_str))
    {
        if let Some(value) = env::var_os(name) {
            child_command.env(name, value);
        }
    }
    child_command.envs(&values);
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        child_command.process_group(0);
    }
    let mut child = child_command
        .spawn()
        .with_context(|| format!("could not start {}", command[0]))?;
    drop(values);

    let stop = Arc::new(AtomicBool::new(false));
    let signal = Arc::clone(&stop);
    ctrlc::set_handler(move || {
        signal.store(true, Ordering::SeqCst);
    })
    .context("could not install the revocation handler")?;
    let deadline = Instant::now() + Duration::from_secs(duration_seconds);
    let (status, outcome) = loop {
        if let Some(status) = child.try_wait().context("could not read child status")? {
            revoke_process_group(child.id());
            break (status, "child-exited".to_string());
        }
        if stop.load(Ordering::SeqCst) || Instant::now() >= deadline {
            let reason = if stop.load(Ordering::SeqCst) {
                "broker-stopped"
            } else {
                "lease-expired"
            };
            revoke_process_group(child.id());
            let _ = child.kill();
            break (
                child.wait().context("could not wait for revoked child")?,
                reason.to_string(),
            );
        }
        thread::sleep(Duration::from_millis(100));
    };
    let receipt = Receipt {
        lease_id: format!("lease-{started}-{}", std::process::id()),
        worktree: worktree.display().to_string(),
        secret_names: report.secret_names,
        started_at_unix: started,
        expires_at_unix: expires,
        revoked_at_unix: unix_now(),
        outcome,
        child_exit_code: status.code(),
    };
    Ok((receipt, status))
}

#[cfg(unix)]
fn revoke_process_group(id: u32) {
    // A negative PID addresses the child's group, including descendants which
    // still hold the leased environment.
    unsafe {
        libc::kill(-(id as i32), libc::SIGKILL);
    }
}

#[cfg(not(unix))]
fn revoke_process_group(_id: u32) {}

pub fn write_template(path: &Path) -> Result<()> {
    if path.exists() {
        bail!("{} already exists. Choose another path", path.display());
    }
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(path, TEMPLATE).with_context(|| format!("could not write {}", path.display()))
}

pub fn unix_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn config(label: &str) -> Config {
        toml::from_str(&format!(
            r#"version=1
lease_minutes=15
[[secrets]]
name="API_TOKEN"
source="op://Development/API/token"
labels=["{label}"]"#
        ))
        .unwrap()
    }

    #[test]
    fn validates_a_development_mapping() {
        let report = validate(&config("development"), false).unwrap();
        assert_eq!(report.secret_names, ["API_TOKEN"]);
    }

    #[test]
    fn denies_production_by_default() {
        let error = validate(&config("production"), false)
            .unwrap_err()
            .to_string();
        assert!(error.contains("denied by default"));
        assert!(validate(&config("production"), true).is_ok());
    }

    #[test]
    fn rejects_duplicate_and_invalid_names() {
        let mut value = config("development");
        value.secrets.push(value.secrets[0].clone());
        assert!(
            validate(&value, false)
                .unwrap_err()
                .to_string()
                .contains("more than once")
        );
        value.secrets.pop();
        value.secrets[0].name = "BAD-NAME".into();
        assert!(validate(&value, false).is_err());
    }

    #[test]
    fn template_is_valid() {
        let parsed: Config = toml::from_str(TEMPLATE).unwrap();
        assert!(validate(&parsed, false).is_ok());
    }
}
