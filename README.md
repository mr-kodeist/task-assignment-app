# Task Assignment App

A full-stack task assignment application with skill-based routing, recursive subtasks, and LLM-powered skill inference. Built for the Codex Solutions / HTX xDigital take-home assignment.
![Task List Page] (screenshots/task-list.png)

## Tech Stack

- **Frontend:** React + TypeScript, via Vite
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL
- **LLM:** Claude API (Anthropic), used for automatic skill classification
- **Containerization:** Docker + Docker Compose (see Part 6 section below)

## Project Structure

```
codex-assignment/
├── backend/          # Express API server
│   ├── src/
│   │   ├── db.ts             # PostgreSQL connection pool
│   │   ├── llm.ts            # Claude API integration for skill inference
│   │   ├── index.ts          # Express app entrypoint
│   │   └── routes/
│   │       ├── tasks.ts      # Task CRUD + business logic
│   │       ├── developers.ts
│   │       └── skills.ts
│   └── db/
│       ├── schema.sql        # Database schema
│       └── seed.sql          # Seed data (Alice, Bob, Carol, Dave)
├── frontend/         # React SPA
│   └── src/
│       ├── pages/
│       │   ├── TaskListPage.tsx      # Task List page
│       │   └── TaskCreationPage.tsx  # Task Creation page with recursive subtasks
│       ├── api.ts            # API client
│       └── types.ts          # Shared TypeScript types
└── docker-compose.yml
```

## Setup & Running Locally

### Prerequisites
- Node.js (v20+)
- Docker Desktop
- An Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### 1. Start PostgreSQL

From the project root:
```bash
docker compose up -d
```

### 2. Apply the schema and seed data

```bash
docker exec -i codex-assignment-db-1 psql -U postgres -d task_assignment < backend/db/schema.sql
docker exec -i codex-assignment-db-1 psql -U postgres -d task_assignment < backend/db/seed.sql
```

### 3. Configure the backend

Create `backend/.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/task_assignment
PORT=4000
ANTHROPIC_API_KEY=your-key-here
```

### 4. Run the backend

```bash
cd backend
npm install
npm run dev
```
Runs on `http://localhost:4000`.

### 5. Run the frontend

```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`.

### Note on Docker vs. local dev workflow

The `docker compose` setup builds static snapshots of the frontend and backend — it does **not** hot-reload when source files change, unlike `npm run dev`. If you're actively developing, running the backend and frontend locally via `npm run dev` (as described above) gives immediate feedback. If you want to verify changes through the full Dockerized stack, rebuild the specific service after making changes:

```bash
docker compose up --build frontend
# or
docker compose up --build backend
```

This project was primarily developed against the local `npm run dev` servers, with Docker used to validate the final, fully-containerized deliverable required by Part 6 of the brief.

## API Endpoints

| Method | Endpoint             | Description                                      |
|--------|-----------------------|--------------------------------------------------|
| GET    | `/api/tasks`          | List all top-level tasks, with nested subtasks   |
| GET    | `/api/tasks/:id`      | Get one task with its skills and subtasks        |
| POST   | `/api/tasks`          | Create a task or subtask (`parentTaskId` optional). If `skillIds` is omitted, skills are inferred via LLM from the title. |
| PATCH  | `/api/tasks/:id`      | Update `assigneeId` and/or `status`              |
| GET    | `/api/developers`     | List all developers with their skills            |
| GET    | `/api/developers/:id` | Get one developer                                |
| GET    | `/api/skills`         | List all skills                                  |
| GET    | `/api/skills/:id`     | Get one skill                                    |

## System Design & Key Decisions

### Recursive subtasks via self-referencing foreign key
`tasks.parent_task_id` references `tasks.id`. A subtask is simply a task row pointing to its parent — this satisfies the requirement that "each subtask has the same properties as a Task," and naturally supports unlimited nesting depth without schema changes. The same recursive pattern is used consistently across the stack: `getTaskWithDetails()` on the backend recursively fetches a task's full subtask tree, and `TaskFormNode` / `TaskRow` on the frontend recursively render themselves for each level of nesting.

### Status: `VARCHAR` + `CHECK` constraint, not `ENUM`
Postgres supports a native `ENUM` type, but I chose a `VARCHAR` column with a `CHECK` constraint instead. Adding a new status value to an `ENUM` requires an `ALTER TYPE ... ADD VALUE` migration, which has real limitations (can't run in a transaction with other changes in some Postgres versions, and values can't be removed or renamed). A `CHECK` constraint is simpler to extend and closer to how I'd model this in SQL Server, which is my primary background.

### Skill-matching and status-cascade rules live in the API layer, not the database
Two business rules — "a task can only be assigned to a developer with the required skills" and "a task can only be marked Done if all its subtasks are Done" — both require comparing data across joined tables or walking a tree, which Postgres `CHECK` constraints cannot do (they can't reference other rows or tables). Both are enforced in `tasks.ts` before any write happens. A trigger-based approach at the database level was considered but rejected for this scope, since keeping the logic in one place (the API) makes it easier to test and reason about.

### LLM skill inference: constrained prompting with a defensive filter
The LLM is only used as a fallback — if the user doesn't specify skills for a task, its title is sent to Claude with a system prompt that hard-constrains the response to the actual set of valid skill names in the database, requesting strict JSON output. Even so, the response is filtered against the known skill list again after parsing, in case the model returns something unexpected — LLM output is treated as untrusted input, the same way user input is validated rather than assumed correct.

### Frontend: client-side filtering as UX, not as enforcement
The Task List page's assignee dropdown only shows developers who already have all the skills a task requires. This is a UX convenience to prevent an invalid selection from being attempted in the first place — the actual enforcement still happens in the backend API, since frontend validation alone is never sufficient for a real business rule.

### Auto-save on the List page, explicit Save on the Creation page
The Task List page's status and assignee dropdowns apply immediately on selection, with no separate "Save" button — this matches the wireframe in the brief, which shows these as plain inline dropdowns with no confirm action alongside them. The Task Creation page, by contrast, uses an explicit Save button, since it involves assembling a potentially deep tree of subtasks before anything should be committed — batching those into one save avoids partial/inconsistent state if the user is still mid-edit.

## Libraries Used

- **express** — HTTP server and routing
- **pg** — PostgreSQL driver
- **cors** — allows the frontend (different port) to call the backend API
- **dotenv** — loads configuration from `.env` rather than hardcoding secrets
- **@anthropic-ai/sdk** — official Claude API client
- **ts-node-dev** — TypeScript hot-reload for local development
- **react-router-dom** — client-side routing between the two pages

## Docker (Part 6)

## Docker (Part 6)

The entire stack — PostgreSQL, backend, and frontend — runs via a single `docker-compose.yml` at the project root.

### Running it

```bash
docker compose up --build
```

This single command:
1. Starts a PostgreSQL 16 container
2. **Automatically applies the schema and seed data** on first run, via files mounted into `/docker-entrypoint-initdb.d/` (a built-in Postgres image feature — any `.sql` files placed there run automatically, in filename order, the first time the container initializes with an empty data directory)
3. Builds and starts the backend (Express API) container
4. Builds and starts the frontend container — a multi-stage build that compiles the React app, then serves the static output via nginx

Once running:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`

### Design notes

- **Backend uses a production build, not the dev server.** The Dockerfile runs `tsc` to compile TypeScript to plain JavaScript once, then runs the compiled output directly with `node` — `ts-node-dev` (used for local development) recompiles on every file change, which is unnecessary overhead inside a container that only needs to run once.
- **Frontend uses a multi-stage build.** The first stage installs dependencies and runs `npm run build` to produce static files; the second, much smaller stage copies only those static files into an `nginx:alpine` image. The final image doesn't contain Node.js, source code, or `node_modules` — just the compiled output and a minimal web server.
- **Custom nginx config for client-side routing.** Since the frontend uses `react-router-dom`'s `BrowserRouter`, a direct visit to a route like `/create` needs to be served `index.html` rather than a literal file at that path (which doesn't exist on disk) — `nginx.conf` handles this fallback.
- **Container-to-container networking uses service names, not `localhost`.** Inside Docker's internal network, the backend reaches PostgreSQL via the hostname `db` (the service name defined in `docker-compose.yml`), not `localhost` — Docker's internal DNS resolves this automatically. This is different from local development, where the backend connects to Postgres via `localhost:5432` since the database is reached through its published port from outside the container.
- **`ANTHROPIC_API_KEY` is injected via a root-level `.env` file** (not committed — see `.gitignore`), which Docker Compose automatically reads for variable substitution in `docker-compose.yml`.

### Note on Docker vs. local dev workflow

The `docker compose` setup builds static snapshots of the frontend and backend — it does **not** hot-reload when source files change, unlike `npm run dev`. If you're actively developing, running the backend and frontend locally via `npm run dev` (as described above) gives immediate feedback. If you want to verify changes through the full Dockerized stack, rebuild the specific service after making changes:

```bash
docker compose up --build frontend
# or
docker compose up --build backend
```

This project was primarily developed against the local `npm run dev` servers, with Docker used to validate the final, fully-containerized deliverable required by Part 6 of the brief.

## Environment Variables

| Variable             | Required | Description                                  |
|-----------------------|----------|-----------------------------------------------|
| `DATABASE_URL`         | Yes      | PostgreSQL connection string                  |
| `PORT`                 | No       | Backend server port (defaults to 4000)        |
| `ANTHROPIC_API_KEY`    | Yes      | Claude API key, used for skill inference      |