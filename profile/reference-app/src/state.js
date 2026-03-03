export const state = {
  orgs: [
    { id: "org-1", login: "ubiquity-os", name: "UbiquityOS" }
  ],
  jobs: new Map(),
  sprints: new Map([
    [
      "sprint-1",
      {
        id: "sprint-1",
        calendar: {
          sprintStart: "2026-03-09",
          sprintEnd: "2026-03-13",
          days: [
            {
              date: "2026-03-09",
              assignments: [
                {
                  issueId: "14",
                  title: "Sprint Management Dashboard MVP",
                  assignee: "alex",
                  priority: "high",
                  effortHours: 6,
                  confidence: 0.72
                }
              ]
            }
          ]
        },
        metrics: {
          windowDays: 7,
          issuesPlanned: 1,
          assignmentTimeSavedHours: 0.08,
          planningTimeSavedHours: 1.5,
          salaryEquivalentSavingsUsd: 158,
          generatedAt: new Date().toISOString()
        },
        overrides: {}
      }
    ]
  ])
};
