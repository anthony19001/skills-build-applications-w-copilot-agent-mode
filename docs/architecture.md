# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Implement React route components in the frontend and keep API URL construction and fetch/error handling in the shared `src/api/client.ts` module. Preserve loading, empty, success, and accessible error states.
- Logic tier decision: Keep Express routes thin and place validation and domain behavior in explicit functions in `src/services/octofitService.ts`. Return deliberate 4xx responses instead of relying on uncaught Mongoose cast errors.
- Data tier decision: Define required fields and relationships in the Mongoose schemas, then use one reusable seed function with stable upserts. Do not clear existing collections or unrelated records.
- Activity tracking approach: Validate ObjectIds, required input fields, and referenced users and teams in the service. On success, compute positive points from minutes and store `user`, `team`, `type`, `minutes`, `points`, and `occurredAt`.
- Team management approach: Validate that a team has a name and mascot and normalize members to an array. Preserve submitted team data and expose member ObjectIds through list and create responses.
- Leaderboard approach: Aggregate activity points by team, sort totals highest first, and return `teamName`, `totalPoints`, and a 1-based `rank` for each entry.
- Workout suggestions approach: Find the user by email, infer the strongest matching focus from recent activities and the user's fitness goal, and order matching workouts first with a short reason. Return a deliberate 4xx for an unknown email.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Failures here mean a schema, relationship, or seed contract is incomplete. Pass when model validation and idempotent seeded demo data satisfy all data tests.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Failures here mean route/service behavior or response shape is incomplete. Pass when activity, team, leaderboard, and personalized workout contracts return the documented status codes and data.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Failures here mean a route does not request or render API data correctly, or a loading, empty, success, or error state is missing or inaccessible.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - A failure means the Express, Mongoose, or TypeScript implementation has a compile/type error.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - A failure means the React/Vite implementation has a compile, type, or bundling error.
