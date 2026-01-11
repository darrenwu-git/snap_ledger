# Sub-Project Context

## Relationship
This directory is a sub-project managed by the root `../TASKS.md`.

## Instruction
- **Source of Truth**: Read `STATUS.md` for local state.
- **Upstream Sync**: If you complete a major milestone, update `../TASKS.md` or ask the user to "Refresh the Dashboard".
- **Server Management**: When testing, ALWAYS kill previous `vite` processes and restart the server cleanly.
- **Port Requirement**: ALWAYS use port **4173** for the dev server (`npm run dev -- --host --port 4173`).

## Deployment & Workflow
- **Production URL**: `https://snap-ledger.ai-builders.space/`
- **Development Port**: `4173` (Default for this project)
- **Workflow**:
  1. Develop on `dev` branch (`localhost:4173`).
  2. Push to `dev` to save work.
  3. Merge `dev` -> `main` to trigger production deploy.
  4. **Production**: `main` branch deployed MANUALLY (or via script) to Koyeb.
  5. **Service Name**: `snap-ledger` (STRICTLY ENFORCED). Never deploy to `snap-ledger-production` or other names.

## Deployment Safety Rules
1. **Prod = Remote (snap-ledger)**: The ONLY remote service is `snap-ledger`.
2. **Dev = Local (localhost:4173)**: Development happens LOCALLY.
3. **Trigger**: Use `npm run deploy` (which runs `scripts/deploy.sh`) to ensure the correct service name is used.

## Release Protocol
- **Patch Bump** (`npm run release:patch`): Use for bug fixes, small tweaks, or when user says 'ship it'.
- **Minor Bump** (`npm run release:minor`): Use for new features, major changes, or when user says 'release [Feature]'.
- **Automation**: These commands automatically bump version, tag, commit, and push to `dev`.

- **Mandatory Unit Tests**: For ANY new feature or bug fix, I must ALWAYS create or update unit tests. Do not wait for verification instructions; tests ARE the verification.
