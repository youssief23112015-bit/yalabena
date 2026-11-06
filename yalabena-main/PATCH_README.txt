SpeakUp TMS - HR fixes + Inventory module (backend + frontend, en/ar)
Extract over the repo root; paths are repo-relative. No database schema change, no migration.
Not built against real dependencies in the authoring sandbox. Run:
  npm ci && npm run build && npm test
  cd front && npm ci && npm run build
Then: git status && git diff
