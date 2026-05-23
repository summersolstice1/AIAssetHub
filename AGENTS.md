# AI & Asset Hub Engineering Guide

This repository is a desktop-oriented AI & Asset Hub. Treat it as a long-lived local-first application, not a throwaway demo. The first priority is architecture stability, security boundaries, and maintainability. Feature work starts only after the related module boundaries are clear.

## Product Context

Core domains:

- AI Dashboard: AI website navigation, API key management, prompt repository.
- System Hub: Python, Conda, CUDA detection, CPU, GPU, and memory telemetry.
- DevLauncher: local application launcher and executable path management.
- SafeBox: local password book and sensitive information encryption.
- Local Sync: LAN HTTP server and mobile config synchronization.

Target direction:

- Tauri + React + TypeScript.
- Local JSON storage.
- All data stays local by default.
- All system calls go through backend code.
- Sensitive data is encrypted before persistence.

## Current Baseline

Current stack:

- Frontend: React, TypeScript, Vite.
- Styling: Tailwind CSS and global CSS.
- Animation: motion/react.
- Icons: lucide-react.
- Backend: Express in `server.ts`.
- Storage: runtime `config.json` in the project working directory.

Current high-risk files:

- `server.ts`: Express routes, config IO, default data, system probes, launcher command execution, LAN sync, and Vite middleware are all mixed together.
- `src/App.tsx`: layout shell, tab navigation, config loading/saving, toast management, theme state, about modal, and panel wiring are all mixed together.
- `src/components/DashboardPanel.tsx`: AI app navigation, API key management, and prompt repository are mixed together.
- `src/components/SafeBoxPanel.tsx`: credential UI, sensitive value visibility, clipboard operations, and config mutation are mixed together.
- `src/components/LocalSyncPanel.tsx`: LAN state, mobile simulator UI, sync submission, export, and logging are mixed together.

## Non-Negotiable Engineering Rules

1. Use TypeScript for all new application code.
2. Do not introduce `any`. Use explicit domain types, `unknown`, discriminated unions, or validation results.
3. All system calls must go through backend services.
4. Frontend code must never call shell commands directly.
5. UI components must not read or write JSON files directly.
6. UI components must not directly operate on raw sensitive persistence data.
7. All sensitive persisted information must be encrypted with AES before storage.
8. Business logic belongs in services, not UI components.
9. Every service must have a single responsibility.
10. Circular dependencies are forbidden.
11. Super-sized components are forbidden. Split by domain, state ownership, and render responsibility.
12. Modules must be designed as replaceable units.
13. New features must be added as modules, not as broad edits to existing core files.
14. State must be managed through a unified store or module-level hooks, not scattered cross-component mutation.
15. Errors must go through a unified error-handling shape.
16. File IO must include fallback behavior.
17. Every config modification must create an automatic backup.
18. Every system command must have a timeout.
19. UI must be componentized.
20. Features must be designed for later extension.

## Change Protocol

Before any code change:

1. Identify impacted modules.
2. Identify current coupling.
3. Identify security and data risks.
4. Explain the refactor reason.
5. Define a rollback plan.

Allowed first-stage work:

- Documentation.
- Type extraction plans.
- Service boundary design.
- Backend route boundary design.
- Small, behavior-preserving refactors after analysis.

Forbidden first-stage work:

- New feature implementation.
- Large UI redesign.
- Replacing storage format without migration.
- Touching multiple core modules in one pass.
- Changing runtime behavior without verification.

## Target Directory Structure

Target structure:

```text
src/
  components/
  pages/
  layouts/
  hooks/
  stores/
  services/
  backend/
  utils/
  types/
  styles/
```

Target frontend service files:

```text
src/services/
  configService.ts
  cryptoService.ts
  systemService.ts
  launcherService.ts
  syncService.ts
  promptService.ts
```

Recommended backend split:

```text
src/backend/
  appServer.ts
  routes/
    configRoutes.ts
    systemRoutes.ts
    launcherRoutes.ts
    syncRoutes.ts
  services/
    configStore.ts
    cryptoStore.ts
    systemProbeService.ts
    commandRunner.ts
    launcherBackendService.ts
    syncBackendService.ts
  middleware/
    errorMiddleware.ts
    authMiddleware.ts
    validateBody.ts
  schemas/
    configSchema.ts
    launcherSchema.ts
    syncSchema.ts
```

## Services Architecture Plan

Frontend services are transport clients. They must not contain Node-only file IO or shell logic.

- `configService.ts`: load config, save config, refresh config, expose typed config operations.
- `cryptoService.ts`: frontend-safe encryption helpers only if needed for UI workflows. Backend remains the source of truth for persisted encryption.
- `systemService.ts`: call backend telemetry and environment endpoints.
- `launcherService.ts`: request backend launch actions using typed launcher IDs or validated paths.
- `syncService.ts`: call LAN sync endpoints, export/import config through backend-controlled operations.
- `promptService.ts`: manage prompt repository operations through config service or dedicated backend endpoints.

Backend services own privileged work.

- `configStore`: reads/writes JSON, creates backups, validates schema, handles fallback.
- `cryptoStore`: AES encryption/decryption for sensitive persistence fields.
- `commandRunner`: executes commands with timeout, allowlist, sanitized arguments, and structured results.
- `systemProbeService`: probes Python, Conda, CUDA, CPU, memory, and GPU data.
- `launcherBackendService`: validates and launches registered executable entries.
- `syncBackendService`: applies sync payloads after validation and authorization.

## Types Structure Plan

Split current `src/types.ts` into domain-specific files:

```text
src/types/
  app.ts
  config.ts
  ai.ts
  prompt.ts
  credentials.ts
  launcher.ts
  system.ts
  sync.ts
  api.ts
  errors.ts
```

Guidelines:

- Domain entities and DTOs must be separate when persistence shape differs from UI shape.
- Sensitive fields need explicit types, for example encrypted-at-rest values versus revealed UI values.
- API responses should use a shared result shape, for example success data or structured error.
- Avoid broad `AppConfig` mutation from UI. Prefer domain operations such as add prompt, delete credential, update launcher entry.

## Backend Communication Plan

Near-term Express plan:

- Keep current endpoint behavior while introducing typed route handlers.
- Add request validation before route logic.
- Add a unified response shape.
- Add centralized error handling.
- Add local auth for LAN endpoints.
- Add config backup before writes.
- Add timeout to all system commands.

Tauri direction:

- Frontend calls typed service functions.
- Service functions can later switch transport from HTTP to Tauri commands without changing UI.
- System calls, file IO, encryption, and process launching remain backend-only.

Recommended API boundaries:

- `GET /api/config`
- `PATCH /api/config/:domain`
- `POST /api/prompts`
- `DELETE /api/prompts/:id`
- `POST /api/credentials`
- `DELETE /api/credentials/:id`
- `GET /api/system/metrics`
- `GET /api/system/env`
- `POST /api/launcher/:id/launch`
- `GET /api/sync/network`
- `POST /api/sync/import`

Avoid long-term whole-config writes from UI.

## State Management Plan

Short term:

- Introduce hooks around current behavior.
- `useConfigStore` or equivalent owns loaded config, loading state, saving state, and refresh.
- `useToastStore` owns toast queue.
- Feature-local UI state stays inside feature components.

Medium term:

- Use a lightweight store for global app state.
- Keep server state and UI state separate.
- Avoid prop drilling of full config through large layout components.

Suggested stores:

```text
src/stores/
  appStore.ts
  configStore.ts
  toastStore.ts
  themeStore.ts
```

Rules:

- UI should dispatch typed domain operations, not mutate nested config objects.
- Store actions call services.
- Services call backend.
- Backend owns persistence.

## Security Architecture Plan

Immediate risks to address:

- Plaintext API keys and passwords in `config.json`.
- LAN-accessible unauthenticated config endpoints.
- Whole-config overwrite endpoints.
- Shell command construction from client-controlled paths.
- Clipboard exposure for sensitive values.
- No schema validation for config or sync payloads.
- No request size limit.
- No command timeout.

Target protections:

- AES encryption at rest for API keys, passwords, tokens, card data, and other secrets.
- Master key or local key derivation strategy documented before implementation.
- Backend-only decrypt operations.
- Least-privilege reveal flow for UI.
- Local auth token for HTTP endpoints.
- LAN sync requires pairing or explicit temporary session token.
- Launcher uses registered IDs and allowlisted executable paths.
- All sync imports are validated and backed up before write.
- All command execution uses timeout and sanitized arguments.
- Config backup is created before every mutation.

## Module Split Plan

AI Dashboard:

- `AIAppsPanel`
- `AIAppCard`
- `ApiKeysPanel`
- `ApiKeyRow`
- `PromptLibraryPanel`
- `PromptCategoryList`
- `PromptCard`
- `PromptEditor`

System Hub:

- `SystemMetricsPanel`
- `MetricGauge`
- `EnvironmentPanel`
- `EnvironmentCard`

DevLauncher:

- `LauncherPanel`
- `LauncherCard`
- `LauncherForm`
- `LauncherStatusBanner`

SafeBox:

- `SafeBoxPage`
- `CredentialCategoryTabs`
- `CredentialCard`
- `CredentialForm`
- `SensitiveValue`

Local Sync:

- `SyncPage`
- `LanServerPanel`
- `SyncAddressPanel`
- `MobileCompanionPanel`
- `SyncLogPanel`

Layout:

- `AppShell`
- `WindowTitleBar`
- `MainNavigation`
- `AboutDialog`
- `ToastViewport`

## MVP Refactor Roadmap

Phase 0: Baseline and rules.

- Add this engineering guide.
- Do not change runtime behavior.
- Record current risks and target boundaries.

Phase 1: Safe service foundation.

- Add typed API services.
- Add unified error type.
- Add config hook/store wrapper.
- Keep existing UI behavior.

Phase 2: Backend boundary split.

- Extract config file IO from `server.ts`.
- Add config backup on write.
- Add request validation.
- Add centralized route error handling.

Phase 3: Security hardening.

- Add AES encryption for sensitive fields.
- Remove plaintext default secrets.
- Add LAN auth/pairing token.
- Replace whole-config write patterns with domain operations.

Phase 4: UI modularization.

- Split `App.tsx` into layout and state wiring.
- Split Dashboard into AI apps, API keys, and prompts.
- Split SafeBox and Local Sync into smaller components.

Phase 5: Tauri readiness.

- Ensure UI only calls frontend services.
- Ensure frontend services can switch from HTTP to Tauri commands.
- Move privileged operations behind backend interfaces.

Phase 6: Feature development.

- Build new functionality only inside established module boundaries.
- Add tests around services and backend behavior before expanding features.

## Development Priority

1. Security boundary and config backup.
2. Config service and typed API layer.
3. Backend extraction from `server.ts`.
4. Sensitive data encryption.
5. State/store consolidation.
6. Dashboard and SafeBox component split.
7. Launcher command hardening.
8. Local Sync pairing and validation.
9. System Hub service separation.
10. New feature work.

## Review Checklist

Before merging a change, verify:

- No new `any`.
- No UI file directly reads or writes JSON.
- No frontend system call.
- No raw shell command built from user input.
- No sensitive value stored in plaintext.
- Config writes create backups.
- Backend commands have timeouts.
- Errors use the shared error model.
- Module boundaries remain acyclic.
- The change is small enough to roll back.
