# ENS Pulse — TODO

## Editorial Pipeline Cron Job

**Goal:** Schedule the editorial pipeline to run once daily so the signals ticker stays fresh automatically.

### Context
- The ticker (`SignalsTicker.tsx`) reads from `signals_ranked.json`
- That file is produced by the editor pipeline (`/Users/oakgroup/Desktop/webdev/editor`)
- Currently requires a manual run: `cd editor && .venv/bin/python -m src.cli.main run --lookback 14d`
- Pipeline takes ~4 minutes, needs Python venv + API keys (OpenAI, X, Discourse)

### Recommended approach: GitHub Action
- [ ] Create `.github/workflows/refresh-signals.yml`
- [ ] Checkout editor repo, install Python deps, run pipeline
- [ ] Copy `signals_ranked.json` to dashboard (commit to repo, or upload to R2/S3)
- [ ] Optionally trigger Vercel redeploy via deploy hook
- [ ] Schedule: `cron: '0 8 * * *'` (daily at 08:00 UTC)
- [ ] Store API keys as GitHub Actions secrets

### Alternatives considered
| Approach | Why not (for now) |
|---|---|
| Vercel Cron | Pipeline is Python; can't run in a serverless function |
| Local launchd/crontab | Dev-only, not portable to production |
| External cron service | Extra dependency, same subprocess problem |

### Bug fix applied
- `editor/src/mcp/editor_server.py:214` — changed `load_config("config.yml")` to use `_project_root / "config.yml"` so the MCP server resolves the config path correctly regardless of cwd. Restart the MCP server to pick this up.
