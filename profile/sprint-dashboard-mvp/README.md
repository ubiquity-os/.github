# Sprint Management Dashboard MVP (Issue #14)

This folder delivers a **mergeable MVP artifact** for `ubiquity-os/.github#14`:

- Conversion-first hero section with **GitHub sign-in** CTA placeholder
- **Priority quick-set** UI (left/right/up swipe equivalent via buttons)
- **Sprint calendar assignment** for real team members (skill-aware mock planner)
- **Quantitative value metrics** (manager time + salary savings)

## Why in `.github/profile/`

Issue #14 is currently tracked in `ubiquity-os/.github` and this repository has no app scaffold yet. To keep scope tight and reviewable, this MVP is shipped as a standalone static artifact under profile assets, enabling maintainers to validate product direction before committing to a full app repo.

## Run locally

```bash
cd profile/sprint-dashboard-mvp
python3 -m http.server 8080
# open http://localhost:8080
```

## Acceptance mapping

- [x] Calendar view of team members and assignments
- [x] Priority-level setting UI (swipe-equivalent controls)
- [x] Quantitative metrics for saved manager time / cost
- [x] Conversion-oriented landing section with GitHub sign-in entry point

## Next implementation slice

1. Replace sign-in placeholder with OAuth callback to ingestion backend.
2. Load real tasks from imported backlog (GitHub/Asana/Jira).
3. Persist priority labels and assignment feedback for model tuning.
