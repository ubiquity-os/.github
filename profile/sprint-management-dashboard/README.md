# UbiquityOS Sprint Management Dashboard MVP

This is a zero-dependency, static MVP for [ubiquity-os/.github#14](https://github.com/ubiquity-os/.github/issues/14). It is intentionally scoped as a reviewable conversion/product slice rather than a broad infrastructure rewrite.

## What is included

- Engineering-manager landing page with a visible mock "Sign in with GitHub" entry point.
- GitHub organization/repository intake concept with read-only OAuth language.
- GitHub issue backlog import model.
- GitHub org scrape → vector embeddings → sprint plan visualization.
- AI-assisted sprint assignment calendar for real team members/tasks.
- Specification parsing signals with time estimates and owner-fit rationale.
- ROI panel that scales by backlog size using the issue's 5-minutes-per-assignment assumption.
- Tinder-style priority bootstrap UI: low, high, urgent labeling controls.
- Asana/Jira expansion markers while keeping the MVP GitHub-first.
- No external scripts, no credentials, no live OAuth, no GitHub write-back.

## Run locally

From the repository root:

```bash
python3 -m http.server 4173 --directory profile/sprint-management-dashboard
```

Then open:

```text
http://127.0.0.1:4173/
```

## Acceptance mapping

| Issue request | Implemented in static MVP |
| --- | --- |
| Simple signup experience for engineering managers | Hero/conversion copy + GitHub sign-in mock + org intake |
| Sign in with GitHub button | Visible primary CTA with read-only scope note |
| Scrape GitHub organization | Intake and pipeline model for GitHub org/repo issue import |
| Generate vector embeddings | Pipeline stage and generated-plan status copy |
| Plan upcoming sprint | Calendar, assignment table, confidence score, owner fit |
| Calendar view of team members and tasks | Five-day sprint calendar with assigned owners |
| Priority levels | Urgent/high/medium/low task model and triage controls |
| Estimate time from specifications | Assignment table and triage card expose parsed signals + hours |
| Quantitative value metrics | Backlog-size ROI calculator with manager-hours and cost saved |
| Support large backlogs | Range input scales from 20 to 520 issues |
| Import from Asana/Jira later | Connector markers in intake and implementation notes |
| Tinder-like priority bootstrap | Low/urgent/high labeling controls update the sprint plan |

## Production handoff

Recommended next implementation slices:

1. Convert the static prototype into a Next.js route or standalone package in the production app.
2. Add GitHub App/OAuth with read-only organization/repository scopes.
3. Ingest issues, labels, assignees, milestones, comments, and repository metadata.
4. Generate summaries/embeddings and cache them by repository sync SHA.
5. Score priority, owner fit, effort estimate, blocker risk, and expected business impact.
6. Keep write-back disabled until the manager explicitly approves assignments.
7. Add Jira/Asana importers only after the GitHub-first funnel is validated.

## QA

Run the bundled verifier:

```bash
node profile/sprint-management-dashboard/verify.mjs
```

The verifier checks required issue coverage, accessibility-oriented selectors, JavaScript syntax, zero external scripts/styles, and common credential patterns.
