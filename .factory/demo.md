# Demo sandbox

- Browser URL: `https://worktree-secret-broker.sociobot.in/?demo=1`
- Alternate browser URL: `https://worktree-secret-broker.sociobot.in/demo`
- Local URL: `http://localhost:5173/?demo=1` after `npm run dev`
- CLI command: `wsb demo`

The sample approves `DATABASE_URL` and `NPM_TOKEN` for a 15-minute lease to
an internal sample check. These are names only. The CLI creates a fresh Git repository
under the OS temporary directory, uses in-memory sample state, prints its
receipt, and removes the repository before exiting. It never calls a provider.

The browser recording uses bundled text. It writes its temporary session marker
only under the `demo:` namespace. **Reset demo** clears that namespace and
starts the recording from its initial state. **Start for real** removes that
namespace, leaves the sandbox, and returns home. Neither action changes
non-demo browser storage.
