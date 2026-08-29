# Worktree Secret Broker

Give one worktree process only the development secrets it needs. The broker
reads approved values from your OS keychain or 1Password CLI. It never writes
those values to the worktree.

This is for developers who create disposable worktrees for coding agents.
Version 0.1.0 is MIT licensed.

## Install

Install the single binary from its public source with Rust 1.85 or newer:

```sh
cargo install --git https://github.com/B-Divyesh/sf-worktree-secret-broker.git --locked
wsb --help
```

The [source repository](https://github.com/B-Divyesh/sf-worktree-secret-broker)
also supports `cargo install --path .` after cloning it.

The factory can prepare the release package with `cargo package --allow-dirty`.
Registry publishing is handled outside this repository.

## Try the sandbox

```sh
wsb demo
```

The command creates a temporary sample worktree and uses in-memory sample
values. It prints a names-only receipt and deletes the directory when done.
It does not read a keychain, contact a network, or save sample data.

Open the browser sample directly at
<https://worktree-secret-broker.sociobot.in/?demo=1>.

## Configure a real worktree

Create `.wsb.toml` outside the worktree, then edit its references:

```sh
wsb init --output "$HOME/.config/wsb/my-app.toml"
wsb check --config "$HOME/.config/wsb/my-app.toml"
```

```toml
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
```

Start exactly one child process in a named Git worktree:

```sh
wsb run \
  --config "$HOME/.config/wsb/my-app.toml" \
  --worktree ../my-app-agent-42 \
  -- npm test
```

`wsb` resolves each approved reference and passes the value in the child
environment. Lease expiry stops the child process. Stopping the broker also
stops it. Each run then prints a names-only receipt. If its parent dies
unexpectedly, a lease supervisor revokes the group and prints a names-only
`broker-parent-died` receipt.

### Providers

- `keychain://SERVICE/ACCOUNT` calls Secret Service through `secret-tool` on
  Linux and Keychain through `security` on macOS.
- `op://VAULT/ITEM/FIELD` calls `op read` and uses your existing 1Password
  session.

The config may set `labels = ["production"]`, but `check` and `run` deny it by
default. An operator can make the exceptional choice with
`--allow-production`. Use `--json` for machine-readable checks and receipts.

The child starts with a cleared environment. The broker restores a short list
of shell basics such as `PATH`, `HOME`, and `TERM`. Add a non-secret parent
variable only when needed:

```toml
[process]
inherit = ["CI"]
```

## Exposure limits

Child processes and privileged local tools may read process environments.
`wsb` narrows the set and lifetime; it cannot make environment variables
invisible to the process that needs them. Avoid production credentials in
agent worktrees. SIGINT, SIGTERM, SIGHUP, lease expiry, and broker-parent death
revoke the complete child process group immediately.

## Develop and verify

```sh
npm install
npm test
npm run build
rustup target add x86_64-apple-darwin
npm run check:macos
```

`npm test` runs Rust tests, builds the static site, and runs browser claim and
accessibility checks. `npm run build` creates the binary in `dist/bin/` and the
deployable site in `dist/site/`. `npm run check:macos` is the supported macOS
target compilation regression check. The static deploy root is `dist/site`.

See [`.factory/demo.md`](.factory/demo.md),
[`CONTRIBUTING.md`](CONTRIBUTING.md), and [`CHANGELOG.md`](CHANGELOG.md).

## Team policy helper

The site includes a local policy helper. It turns unique variable names into
development-only provider references without a network request. The helper
rejects duplicate names and does not ask for secret values.

## Team review tools

The CLI and local policy helper work without a license. Team review tools cost
$19 once and add a reusable policy review checklist.

[Buy team review tools through Sociobot](https://api.sociobot.in/api/v1/products/worktree-secret-broker/checkout).
After checkout, the site stores the returned license in this browser and checks
it with Sociobot. Existing buyers can paste a license on the product page.
Sociobot and Dodo are the merchant of record. Refunds are handled there.

## Privacy

The site has no analytics. The browser demo uses bundled sample text and keeps
its session state under `demo:` keys. The site sends a stored license only to
Sociobot for verification. The CLI only resolves the provider references in
your config for the child process you start. See the published
[privacy](https://worktree-secret-broker.sociobot.in/privacy) and
[terms](https://worktree-secret-broker.sociobot.in/terms) pages.

Copyright 2026 Sociobot (Param Factory). Released under the MIT License.
