use anyhow::{Context, Result, bail};
use clap::{Parser, Subcommand};
use std::env;
use std::fs;
use std::path::PathBuf;
use std::process::{Command, ExitCode};
use worktree_secret_broker::{
    Receipt, check_providers, load_config, run_lease, run_lease_supervisor, validate,
    write_template,
};

#[derive(Parser)]
#[command(name = "wsb", version, about = "Give one worktree process only its approved development secrets", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Write a names-only starter config
    Init {
        #[arg(long, default_value = ".wsb.toml")]
        output: PathBuf,
    },
    /// Validate names, policy, references, and installed provider CLIs
    Check {
        #[arg(short, long)]
        config: PathBuf,
        #[arg(long)]
        allow_production: bool,
        #[arg(long)]
        json: bool,
    },
    /// Lease approved secrets to one child process
    Run {
        #[arg(short, long)]
        config: PathBuf,
        #[arg(short, long)]
        worktree: PathBuf,
        #[arg(long)]
        ttl: Option<u64>,
        /// Short lease for automated checks; normal use should set --ttl in minutes
        #[arg(long, hide = true, conflicts_with = "ttl")]
        ttl_seconds: Option<u64>,
        #[arg(long)]
        allow_production: bool,
        #[arg(long)]
        json: bool,
        #[arg(last = true, required = true)]
        command: Vec<String>,
    },
    /// Run a bundled, isolated sample without reading real secrets
    Demo {
        #[arg(long)]
        json: bool,
    },
    #[command(name = "__demo-child", hide = true)]
    DemoChild,
    #[command(name = "__lease-supervisor", hide = true)]
    LeaseSupervisor {
        #[arg(long)]
        lease_id: String,
        #[arg(long)]
        worktree: PathBuf,
        #[arg(long = "secret-name")]
        secret_names: Vec<String>,
        #[arg(long)]
        started_at_unix: u64,
        #[arg(long)]
        expires_at_unix: u64,
        #[arg(last = true, required = true)]
        command: Vec<String>,
    },
}

fn main() -> ExitCode {
    match execute() {
        Ok(code) => ExitCode::from(code),
        Err(error) => {
            eprintln!("error: {error:#}");
            ExitCode::from(1)
        }
    }
}

fn execute() -> Result<u8> {
    match Cli::parse().command {
        Commands::Init { output } => {
            write_template(&output)?;
            println!(
                "Wrote {}. Replace the sample references, then run wsb check.",
                output.display()
            );
            Ok(0)
        }
        Commands::Check {
            config,
            allow_production,
            json,
        } => {
            let config = load_config(&config)?;
            let report = validate(&config, allow_production)?;
            check_providers(&config)?;
            if json {
                println!("{}", serde_json::to_string(&report)?);
            } else {
                println!(
                    "Config valid: {} approved name(s); providers: {}.",
                    report.secret_names.len(),
                    report.providers.join(", ")
                );
            }
            Ok(0)
        }
        Commands::Run {
            config,
            worktree,
            ttl,
            ttl_seconds,
            allow_production,
            json,
            command,
        } => {
            let config = load_config(&config)?;
            let (receipt, status) = run_lease(
                &config,
                &worktree,
                &command,
                ttl,
                ttl_seconds,
                allow_production,
            )?;
            print_receipt(&receipt, json)?;
            if receipt.outcome == "lease-expired" {
                Ok(124)
            } else {
                Ok(status.code().unwrap_or(1).clamp(0, 255) as u8)
            }
        }
        Commands::Demo { json } => demo(json),
        Commands::DemoChild => {
            if env::var("DATABASE_URL").as_deref() != Ok("demo-database")
                || env::var("NPM_TOKEN").as_deref() != Ok("demo-npm")
            {
                bail!("the demo child did not receive its approved sample variables");
            }
            Ok(0)
        }
        Commands::LeaseSupervisor {
            lease_id,
            worktree,
            secret_names,
            started_at_unix,
            expires_at_unix,
            command,
        } => {
            let (receipt, status) = run_lease_supervisor(
                lease_id,
                worktree,
                secret_names,
                started_at_unix,
                expires_at_unix,
                command,
            )?;
            if let Some(receipt) = receipt {
                // The broker has already died, so its parent-death supervisor
                // is the only process able to leave a names-only receipt.
                print_receipt(&receipt, true)?;
            }
            Ok(status.code().unwrap_or(1).clamp(0, 255) as u8)
        }
    }
}

fn demo(json: bool) -> Result<u8> {
    // The shipped browser recording is a stable, bundled sample. Keeping its
    // receipt timestamps fixed lets people compare every shown receipt field
    // with `wsb demo --json` without exposing a machine-specific path.
    const SAMPLE_STARTED_AT: u64 = 1_787_913_600;
    let root = env::temp_dir().join(format!(
        "wsb-demo-{}-{}",
        std::process::id(),
        worktree_secret_broker::unix_now()
    ));
    fs::create_dir_all(&root).context("could not create the demo directory")?;
    let cleanup = DemoDir(root.clone());
    let status = Command::new("git")
        .args(["init", "-q"])
        .current_dir(&root)
        .status()
        .context("could not start git for the demo")?;
    if !status.success() {
        bail!("could not create the sample worktree");
    }

    if !json {
        println!("Demo — sample data, nothing is saved");
        println!("Temporary worktree: {}", root.display());
        println!("Approved: DATABASE_URL, NPM_TOKEN");
        println!("Lease: 15 minutes → sample check");
    }
    let mut child = Command::new(env::current_exe().context("could not locate the demo binary")?);
    child
        .arg("__demo-child")
        .current_dir(&root)
        .env_clear()
        .env("DATABASE_URL", "demo-database")
        .env("NPM_TOKEN", "demo-npm");
    if json {
        child.stdout(std::process::Stdio::null());
    }
    let child_status = child
        .status()
        .context("could not start the isolated demo child")?;
    if !child_status.success() {
        bail!("the isolated demo child failed its sample check");
    }
    if !json {
        println!("✓ child received 2 approved variable names");
    }
    let receipt = Receipt {
        lease_id: format!("demo-{SAMPLE_STARTED_AT}"),
        worktree: root.display().to_string(),
        secret_names: vec!["DATABASE_URL".into(), "NPM_TOKEN".into()],
        started_at_unix: SAMPLE_STARTED_AT,
        expires_at_unix: SAMPLE_STARTED_AT + 900,
        revoked_at_unix: SAMPLE_STARTED_AT + 1,
        outcome: "demo-complete".into(),
        child_exit_code: Some(0),
    };
    print_receipt(&receipt, json)?;
    drop(cleanup);
    if !json {
        println!("Temporary worktree removed.");
    }
    Ok(0)
}

fn print_receipt(receipt: &Receipt, json: bool) -> Result<()> {
    if json {
        println!("{}", serde_json::to_string(receipt)?);
    } else {
        println!("Receipt {}", receipt.lease_id);
        println!("  worktree: {}", receipt.worktree);
        println!("  names: {}", receipt.secret_names.join(", "));
        println!("  started: {}", receipt.started_at_unix);
        println!("  expires: {}", receipt.expires_at_unix);
        println!("  outcome: {}", receipt.outcome);
        println!("  revoked: {}", receipt.revoked_at_unix);
    }
    Ok(())
}

struct DemoDir(PathBuf);
impl Drop for DemoDir {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}
