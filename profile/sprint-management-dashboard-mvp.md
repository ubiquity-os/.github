# Sprint Management Dashboard MVP (Issue #14)

This document scopes a **ship-fast MVP** for the UbiquityOS Sprint Management Dashboard focused on engineering managers.

## Goal

Convert engineering managers from social posts and technical writeups into signed-in users who can:

1. connect a GitHub organization,
2. see an AI-generated sprint plan/calendar,
3. understand concrete time/$ value created by the system.

## Product Promise (MVP)

> Connect your GitHub org, auto-plan your next sprint, and quantify manager time saved.

## User Journey

1. **Landing page** explains value proposition + CTA.
2. User clicks **Sign in with GitHub**.
3. User selects accessible org/repo scope.
4. System ingests:
   - issues/PR metadata,
   - team members and contribution signals,
   - labels/milestone context.
5. System creates an initial sprint recommendation:
   - task priority tiers,
   - suggested assignee,
   - estimated effort,
   - timeline view.
6. User sees a dashboard with:
   - sprint calendar/board,
   - value metrics (hours and salary-equivalent saved),
   - quick controls to tune priorities.

## MVP Scope (Must-Have)

### 1) Landing + Conversion

- one clear hero section (problem + outcome),
- social proof placeholders,
- single CTA: **Sign in with GitHub**.

### 2) Auth + Org Connect

- GitHub OAuth login,
- org selection,
- basic permission check and ingest trigger.

### 3) Ingestion Pipeline (V1)

- import open issues from selected repos,
- map labels to simple priority seed (`urgent`, `high`, `normal`, `low`),
- infer candidate assignee from recent authors/reviewers/contributors.

### 4) Sprint Planning Engine (V1)

- effort estimation heuristic by issue metadata (size/labels/history),
- recommended assignment for each issue,
- confidence score per recommendation,
- week view plan generation.

### 5) Dashboard (V1)

- week calendar view,
- issue cards with: title, priority, assignee, estimate, confidence,
- summary metrics:
  - estimated assignment time saved,
  - estimated planning hours saved,
  - manager salary-equivalent savings.

### 6) Priority Tuning UX (MVP-lite)

- quick triage controls (`Low`, `High`, `Urgent`) on issue cards,
- recalculate plan after edits.

## Out of Scope (Post-MVP)

- Asana/Jira/Linear integrations,
- full historical sprint analytics,
- advanced multi-org governance,
- complex simulation UI.

## Architecture Sketch

- **Frontend:** Landing + authenticated dashboard (React/Next.js suggested).
- **Backend API:** OAuth callback, ingestion jobs, planning endpoints.
- **Workers:** async ingestion + embedding + planning jobs.
- **Storage:**
  - relational DB for users/orgs/issues/plans,
  - vector store for issue/spec embeddings.

## Data Model (MVP)

- `organizations`
- `repositories`
- `team_members`
- `issues`
- `sprint_plans`
- `sprint_plan_items`
- `value_metrics_snapshots`

## Acceptance Criteria (MVP)

- user can sign in with GitHub and connect at least one org,
- selected repo issues appear in dashboard,
- each issue has AI priority + assignee suggestion + effort estimate,
- week view renders planned assignments,
- dashboard displays at least 3 value metrics,
- manual priority adjustment updates plan output.

## Delivery Plan (Three PRs)

1. **PR-1: Product/Tech scaffold**
   - landing skeleton + OAuth wiring + DB schema draft.
2. **PR-2: Ingestion + planning core**
   - import issues, generate priority/assignee/estimate.
3. **PR-3: Dashboard + value metrics**
   - week view, issue cards, metric computations.

## Suggested KPI Targets (first 30 days)

- landing -> GitHub sign-in conversion rate,
- first plan generated within 5 minutes,
- median manager setup time < 10 minutes,
- weekly active orgs,
- perceived usefulness score (quick in-app prompt).

## Risks & Mitigations

- **Noisy issue data** -> fallback to conservative defaults + confidence indicator.
- **Permission friction** -> clear scope explanation and minimum required scopes.
- **Weak early recommendations** -> keep manual override fast and visible.

## Next Step

Open implementation PR against product codebase with:

- landing page + OAuth,
- ingestion job skeleton,
- first sprint recommendation endpoint.
