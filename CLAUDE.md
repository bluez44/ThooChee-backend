# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start:dev       # Dev server with hot-reload (port 3000 or $PORT)
npm run build           # Compile TypeScript to dist/
npm run start:prod      # Run compiled build

npm run lint            # ESLint with auto-fix
npm run format          # Prettier format

npm run test            # Unit tests (Jest, rootDir: src, *.spec.ts)
npm run test:watch      # Watch mode
npm run test:e2e        # E2E tests (test/jest-e2e.json config)
npm run test:cov        # Coverage report
```

Run a single test file:
```bash
npx jest src/app.controller.spec.ts
```

## Architecture

This is a **NestJS 11** backend for a **Smart Voice Expense Manager** app. The source is in `src/`, compiled output goes to `dist/`. The project is in early scaffolding stage — only the default `AppModule` exists; all feature modules are yet to be built.

**Planned API surface** (see `API_DTOS.md` for full DTO specs):

| Module | Routes |
|---|---|
| Transactions | `GET/POST /api/transactions`, `GET/PUT/DELETE /api/transactions/:id` |
| Voice NLP | `POST /api/voice/parse` — parses raw voice transcript → `CreateTransactionDTO` |
| Budget | `GET/PUT /api/budget` — monthly limit per user |
| Profile | `GET/PUT /api/profile` — user preferences |

**NestJS conventions to follow:**
- Each domain gets its own module folder: `src/<domain>/<domain>.module.ts`, `.controller.ts`, `.service.ts`
- DTOs go in `src/<domain>/dto/` and should mirror the interfaces in `API_DTOS.md`
- Use `@nestjs/common` decorators (`@Controller`, `@Get`, `@Post`, `@Body`, `@Param`, `@Query`)
- Register each new module in `AppModule` imports

**TypeScript config notes:**
- `noImplicitAny` is **off** — don't rely on this for type safety
- `strictNullChecks` is **on**
- `emitDecoratorMetadata` is enabled (required for NestJS DI)
- Module resolution: `nodenext` — use explicit `.js` extensions in relative imports if needed
