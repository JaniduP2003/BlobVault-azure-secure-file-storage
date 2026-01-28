# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: ASP.NET Core 9 API; controllers in `Controllers/`, EF Core context/migrations in `Data/` and `Migrations/`, services in `Services/`; configuration via `appsettings*.json`; SQLite DB persisted in `backend-data/` when dockerized.
- `frontend/`: Next.js 16 App Router; pages in `src/app`, shared UI in `src/components`, client state in `contexts/` and `hooks/`; public assets in `public/`.
- Root utilities: `docker-compose.yml` for full stack + Azurite, `azurite/` data volume, and API smoke scripts (`test-*.sh`) expecting backend on `http://localhost:8081`.

## Build, Test, and Development Commands
- Full stack (backend, frontend, Azurite):
```bash
docker-compose up --build
```
- Backend solo:
```bash
cd backend
Dotnet restore
Dotnet run --urls http://localhost:8080
```
Migrations auto-apply on startup; change connection strings in `appsettings.Development.json`.
- Frontend solo:
```bash
cd frontend
npm install
npm run dev  # http://localhost:3000
npm run lint # ESLint (Next core-web-vitals rules)
```
- API smoke suites (require `jq`): run from repo root with backend live on 8081, e.g. `./test-folders.sh` or `./test-storage-quota.sh`.

## Coding Style & Naming Conventions
- C#: 4-space indent; PascalCase for classes/DTOs, camelCase for locals/params; keep controllers thin and inject services via DI; favor async methods. Place new EF entities in `Models/`, DTOs in `DTOs/`, migrations through `dotnet ef migrations add`.
- TypeScript/Next: Functional components with hooks; components PascalCase in `src/components`; app routes in kebab-case folder names under `src/app`; prefer `clsx`/`tailwind-merge` for styling; keep API clients in `lib/`.

## Testing Guidelines
- Currently shell-based smoke tests only. Each script registers a disposable user; no DB reset is performed, so purge `backend-data/` if state drifts. Aim to add unit/integration tests alongside code (`backend/Tests/`, `frontend/__tests__/`) when introducing complex logic.

## Commit & Pull Request Guidelines
- Follow existing log style: `ADD:: summary`, `FIX:: summary`, `CHORE:: summary`; keep messages imperative and scoped to one change set.
- PRs should include: purpose + linked issue, setup steps, test evidence (commands run or screenshots for UI), and call out breaking changes or config updates (e.g., new env vars).

## Security & Configuration Tips
- Never commit real `Jwt:Key` or Azure connection strings; use environment variables (`AzureStorage__ConnectionString`, `Jwt__Key`, etc.).
- CORS is locked to `http://localhost:3000`; adjust `AllowFrontend` policy when adding domains.
- Uploaded files and SQLite DB persist in `backend-data/`; clear when handling sensitive test data.
