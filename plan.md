# Slotify — Implementation Plan

## Context
Building a ground-up mobile parking management app (Slotify) with three user personas (Admin, Employee, Security). Monorepo structure. Backend first, then mobile.

**Stack:** React Native + Expo (TypeScript) | Node.js + Fastify (TypeScript) | PostgreSQL | Prisma ORM | JWT + bcrypt | Docker Compose

---

## Phase 1: Backend API

### 1-A: Project Scaffold

**Files to create:**
- `docker-compose.yml` (repo root) — PostgreSQL 16-alpine, port 5432, volume `postgres_data`
- `backend/package.json` — deps: fastify, @fastify/jwt, @fastify/cors, @fastify/sensible, @prisma/client, bcrypt, zod, zod-to-json-schema, dotenv; devDeps: prisma, typescript, tsx, vitest, supertest, @types/*
- `backend/tsconfig.json` — target ES2022, moduleResolution NodeNext, strict
- `backend/.env.example` — DATABASE_URL, JWT_SECRET (min 32 chars), PORT=3000
- `backend/src/config/env.ts` — Zod-validated env parse; fail-fast on startup
- `backend/src/db/prisma.ts` — singleton PrismaClient
- `backend/src/app.ts` — buildApp() factory (plugins + routes, no listen call)
- `backend/src/index.ts` — calls buildApp().listen()

**Verify:** `docker compose up -d db && npm run dev` → server on port 3000

---

### 1-B: Database Schema

**File:** `backend/prisma/schema.prisma`

**Models:**
```
User                id(uuid), email(unique), passwordHash, role(ADMIN|EMPLOYEE|SECURITY)
EmployeeProfile     id(uuid), userId(FK unique), employeeId(unique), vehicleId, phoneNumber
ParkingSlot         id(uuid), slotCode(unique, e.g. "M4333"), level(int), type(TWO_WHEELER|FOUR_WHEELER), isActive(bool)
CheckIn             id(uuid), slotId(FK), userId(FK), vehicleId(snapshot), checkedInAt, checkedOutAt(nullable)
SlotFlag            id(uuid), slotId(FK), vehicleId, reportedById(FK), reportedAt, resolvedAt(nullable), resolvedById(FK nullable)
PasswordResetToken  id(uuid), userId(FK), token(unique), expiresAt, usedAt(nullable), createdAt
```

**Key decisions:**
- Soft-delete slots (isActive=false) to preserve historical CheckIn integrity
- checkedOutAt=null means active occupancy
- vehicleId denormalized onto CheckIn (snapshot at check-in time)
- PasswordResetToken stores a secure random token with 1-hour expiry; usedAt marks single-use tokens

**Slot code format:** One uppercase letter + 4 digits (e.g. M4333, C3454, M0234)
- Regex: `/^[A-Z]\d{4}$/`

**File:** `backend/prisma/seed.ts`
- Admin: `admin@slotify.com` / `Admin@1234`
- Security: `security@slotify.com` / `Security@1234`
- 10 sample slots (5 TWO_WHEELER, 5 FOUR_WHEELER)

**Scripts:** `npm run db:migrate` → `npm run db:seed`

---

### 1-C: Auth Module

**Files:** `backend/src/modules/auth/auth.{routes,service,schema}.ts`
**File:** `backend/src/hooks/authenticate.ts` — `authenticate()` preHandler + `requireRole(...roles)` factory
**File:** `backend/src/types/fastify.d.ts` — augment FastifyJWT with `{ userId, role }`

**Endpoints:**
| Method | Path | Who | Logic |
|--------|------|-----|-------|
| POST | /api/auth/login | ADMIN, SECURITY | bcrypt compare → JWT (reject EMPLOYEE) |
| POST | /api/auth/register | public | Create User(EMPLOYEE) + EmployeeProfile in transaction → JWT |
| POST | /api/auth/signin | EMPLOYEE | Same as login but rejects non-EMPLOYEE |
| POST | /api/auth/forgot-password | public | Generate secure token → store PasswordResetToken (1hr expiry) → return token in dev / email in prod |
| POST | /api/auth/reset-password | public | Validate token (exists, not expired, not used) → hash new password → mark token used |

**Password Reset Flow:**
1. Any user calls `POST /api/auth/forgot-password` with `{ email }`
2. Server generates a cryptographically random token (`crypto.randomBytes(32).toString('hex')`)
3. Stores in `PasswordResetToken` table with `expiresAt = now + 1 hour`
4. In `NODE_ENV=development`: token returned in response (for testing without email setup)
5. In production: email sent via configurable SMTP (placeholder for now, log token)
6. User calls `POST /api/auth/reset-password` with `{ token, newPassword }`
7. Validates token: found + not expired + usedAt=null; otherwise 400
8. Updates `User.passwordHash`, sets `PasswordResetToken.usedAt = now`

**Response (login/signin/register):** `{ token, role, userId }`

---

### 1-D: Slots Module (Admin CRUD)

**Files:** `backend/src/modules/slots/slots.{routes,service,schema}.ts`

**Slot code validation:** `/^[A-Z]\d{4}$/` (e.g. M4333, C3454)

**Endpoints (all require `requireRole("ADMIN")`):**
| Method | Path | Logic |
|--------|------|-------|
| GET | /api/slots | List active slots, order by level/slotCode |
| POST | /api/slots | Create; validate slotCode format; 409 on duplicate |
| PUT | /api/slots/:id | Partial update; 409 on duplicate slotCode |
| DELETE | /api/slots/:id | Soft-delete (isActive=false); 400 if active check-in exists |

---

### 1-E: Employee Module (Available Slots + Check-In)

**Files:** `backend/src/modules/checkins/checkins.{routes,service,schema}.ts`

**Endpoints (all require `requireRole("EMPLOYEE")`):**
| Method | Path | Logic |
|--------|------|-------|
| GET | /api/slots/available | Slots where isActive=true AND no CheckIn with checkedOutAt=null |
| POST | /api/checkins | Validate slot active, slot not occupied, user not already checked-in → create CheckIn |
| PATCH | /api/checkins/:id/checkout | Set checkedOutAt=now() |
| GET | /api/checkins/mine | Employee's own check-in history |

**Note:** Register `/api/slots/available` route before admin slots CRUD to prevent `:id` param capture.

---

### 1-F: Reports + Flags Modules

**Files:** `backend/src/modules/reports/reports.{routes,service}.ts`
**Files:** `backend/src/modules/flags/flags.{routes,service,schema}.ts`

**Report endpoint (`requireRole("ADMIN","SECURITY")`):**
- `GET /api/reports/daily` → `{ generatedAt, totalSlots, usedSlots, emptySlots, occupiedSlots: [{slotId, vehicleNumber}] }`
- Query: active CheckIns with checkedInAt >= today AND checkedOutAt=null

**Flags endpoints:**
| Method | Path | Role | Logic |
|--------|------|------|-------|
| POST | /api/flags | SECURITY | Slot must be active + no registered check-in; creates SlotFlag |
| GET | /api/flags | ADMIN | All flags, desc order; optional `?resolved=false` filter |
| PATCH | /api/flags/:id/resolve | ADMIN | Set resolvedAt=now(), resolvedById; 400 if already resolved |

---

### 1-G: Error Handling + App Wiring

**File:** `backend/src/utils/errors.ts` — `AppError(statusCode, message, code)` + helpers: `notFound`, `conflict`, `forbidden`, `badRequest`, `unauthorized`

**Global error handler in app.ts:**
- `AppError` → `{ error: code, message }`
- Fastify validation errors → `{ error: "VALIDATION_ERROR", details }`
- Unexpected → 500

**Plugin + route registration order in app.ts:**
1. cors, jwt, sensible plugins
2. `/api/auth` → auth routes (including forgot-password + reset-password)
3. `/api/slots` → employee available-slots route (literal path, registered first)
4. `/api/slots` → admin CRUD routes
5. `/api/checkins` → check-in routes
6. `/api/reports` → report routes
7. `/api/flags` → flag routes

---

### 1-H: Tests (Vitest)

**Pattern:** `buildApp()` + `app.inject()` — no real HTTP port, no mocking

**Files:** `backend/tests/{setup,auth,slots,checkins,reports,flags}.test.ts`

**Key cases per module:**
- **auth:** admin login ✓/✗, employee register (success/duplicate email/duplicate employeeId), role enforcement on wrong endpoint, forgot-password returns token in dev, reset-password updates password, expired/used token rejected
- **slots:** admin CRUD ✓, employee blocked (403), duplicate slotCode (409), invalid format (400)
- **checkins:** check-in to free slot ✓, occupied slot (409), double check-in (409), checkout ✓, available list updates
- **reports:** admin ✓, security ✓, employee blocked (403), counts correct
- **flags:** security creates flag ✓, occupied slot blocked (400), admin resolves ✓, security resolve blocked (403), double-resolve (400)

---

## Phase 2: Mobile App (React Native + Expo) — Planned After Phase 1

Screens per persona:
- **Admin:** Login → Dashboard → Slot Manager (CRUD) → Daily Report → Flags list + resolve → Reset Password
- **Employee:** Register → Login → Available Slots → Check-In → My Check-ins → Reset Password
- **Security:** Login → Daily Report → Flag a Slot → Reset Password

Navigation: Expo Router (file-based), role-based tab/stack layout, JWT stored in SecureStore.

---

## Folder Structure (End State Phase 1)

```
tw-parking/
├── plan.md
├── docker-compose.yml
├── specification.md
└── backend/
    ├── prisma/
    │   ├── schema.prisma
    │   └── seed.ts
    ├── src/
    │   ├── config/env.ts
    │   ├── db/prisma.ts
    │   ├── types/fastify.d.ts
    │   ├── utils/errors.ts
    │   ├── plugins/{auth,cors,sensible}.ts
    │   ├── hooks/authenticate.ts
    │   ├── modules/
    │   │   ├── auth/               ← login, register, signin, forgot-password, reset-password
    │   │   ├── slots/              ← admin CRUD + available slots
    │   │   ├── checkins/           ← check-in, check-out, my history
    │   │   ├── reports/            ← daily report
    │   │   └── flags/              ← create flag, list, resolve
    │   ├── app.ts
    │   └── index.ts
    ├── tests/
    ├── .env.example
    ├── package.json
    └── tsconfig.json
```
