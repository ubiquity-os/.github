# Sprint Management Dashboard

Real-time sprint tracking, team velocity analysis, and task distribution for [UbiquityOS](https://github.com/ubiquity-os) repositories.

## Features

- **Sprint Board** — Kanban view with real-time task tracking
- **Velocity Metrics** — Historical sprint velocity and burn-down charts
- **Team Distribution** — Task allocation by assignee and label
- **OAuth Authentication** — GitHub OAuth with httpOnly session cookies
- **Middleware Guards** — Protected routes via Next.js edge middleware

## Getting Started

### Prerequisites

- Node.js ≥ 18
- GitHub OAuth App credentials

### Environment Variables

```bash
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
```

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: Tailwind CSS + Radix UI primitives
- **Animations**: Framer Motion
- **Auth**: GitHub OAuth with CSRF state validation
- **Deployment**: Vercel-ready
