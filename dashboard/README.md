# Sprint Management Dashboard

AI-powered sprint planning tool for engineering teams. Automate task assignment, save hours of manual work every sprint.

## Features

1. **Landing Page** — Marketing conversion page with "Sign in with GitHub" OAuth
2. **Sprint Dashboard** — Calendar view with team member task assignments
3. **Priority System** — Tinder-like swipe interface for task prioritization (low / high / urgent)
4. **AI Sprint Planning** — Auto-assign tasks based on team skills, labels, and availability
5. **Metrics** — Time & cost savings calculator (minutes saved, hours saved, $ saved)
6. **Task Import** — Bulk import open issues from GitHub organization repos

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Auth**: NextAuth.js (GitHub OAuth)
- **GitHub API**: Octokit
- **AI**: OpenAI-compatible API (optional, falls back to heuristic)

## Quick Start

```bash
# 1. Install dependencies
cd dashboard
npm install

# 2. Copy environment config
cp .env.example .env.local

# 3. Configure GitHub OAuth
# Create an OAuth app at https://github.com/settings/developers
# Set GITHUB_ID and GITHUB_SECRET in .env.local

# 4. (Optional) Configure AI for smart sprint planning
# Set OPENAI_API_KEY in .env.local

# 5. Run dev server
npm run dev
# Open http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GITHUB_ID` | ✅ | GitHub OAuth App Client ID |
| `GITHUB_SECRET` | ✅ | GitHub OAuth App Client Secret |
| `NEXTAUTH_URL` | ✅ | Base URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | ✅ | Random secret for JWT signing |
| `OPENAI_API_KEY` | ❌ | For AI-powered sprint planning |
| `OPENAI_BASE_URL` | ❌ | Custom OpenAI-compatible endpoint |
| `ENG_MANAGER_HOURLY_RATE` | ❌ | Default: $75/hr |
| `MINUTES_PER_MANUAL_ASSIGNMENT` | ❌ | Default: 5 min |

## Usage

1. **Sign in** with your GitHub account on the landing page
2. **Import tasks** — Enter a GitHub org name and token to scan repos and import open issues
3. **Prioritize** — Use the swipe interface to set task priority (low / high / urgent)
4. **Plan sprint** — Click "AI Plan Sprint" to auto-assign tasks to team members
5. **View calendar** — See the sprint schedule with tasks distributed across the week
6. **Track savings** — Check the Metrics tab for time/cost savings

## API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth.js GitHub OAuth |
| `/api/org/sync` | POST | Sync repos & issues from a GitHub org |
| `/api/sprint/plan` | POST | Generate AI sprint assignments |
| `/api/metrics` | POST | Calculate time/cost savings metrics |

## Architecture

```
dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Sprint dashboard
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts  # OAuth
│   │       ├── org/sync/route.ts            # GitHub sync
│   │       ├── sprint/plan/route.ts         # AI planning
│   │       └── metrics/route.ts             # Metrics calc
│   └── components/
│       ├── CalendarView.tsx       # Weekly calendar grid
│       ├── PrioritySwiper.tsx     # Swipe prioritization
│       ├── MetricsPanel.tsx       # Savings dashboard
│       └── TaskImport.tsx         # GitHub import panel
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── .env.example
```

## License

MIT
