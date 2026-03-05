# Sprint Planning Engine Spec (PR-2)

## Objective

Produce first-pass assignment and priority recommendations for a 1-week sprint horizon.

## Inputs

- normalized issue snapshots
- team member activity signals
- repo label/milestone context

## Output per issue

- `priority`: low | normal | high | urgent
- `effort_hours`: numeric estimate
- `recommended_assignee`: member handle
- `confidence`: 0..1
- `reasons`: human-readable rationale list

## Heuristics (v1)

1. **Priority seed**
   - labels (`critical`,`bug`,`security`,`urgent`) => high/urgent bias
   - stale/low-impact labels => low bias
2. **Effort estimate**
   - title/body token length + labels + historical merge cadence
3. **Assignee recommendation**
   - contributor familiarity score
   - recent review/merge ownership
   - availability proxy (recent load)
4. **Confidence score**
   - data completeness + signal agreement

## Constraints

- never overwrite explicit human assignee/priority without user action
- expose reasons for every recommendation
- low confidence (<0.45) should be visually flagged
