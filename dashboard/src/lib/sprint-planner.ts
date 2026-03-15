import {
  GitHubIssue,
  GitHubUser,
  Sprint,
  SprintTask,
  TeamMember,
  Priority,
  ROIMetrics,
} from "@/types";
import { generateId } from "./utils";

const PRIORITY_KEYWORDS: Record<Priority, string[]> = {
  urgent: [
    "critical",
    "blocker",
    "hotfix",
    "security",
    "vulnerability",
    "crash",
    "down",
    "outage",
    "breaking",
    "urgent",
    "emergency",
    "p0",
    "sev0",
    "sev1",
  ],
  high: [
    "bug",
    "fix",
    "error",
    "broken",
    "regression",
    "important",
    "priority",
    "customer",
    "revenue",
    "p1",
    "high",
  ],
  medium: [
    "feature",
    "enhancement",
    "improvement",
    "refactor",
    "update",
    "add",
    "implement",
    "p2",
    "medium",
  ],
  low: [
    "docs",
    "documentation",
    "chore",
    "cleanup",
    "nice-to-have",
    "cosmetic",
    "typo",
    "p3",
    "low",
    "minor",
  ],
};

const COMPLEXITY_SIGNALS: Record<string, number> = {
  // Size signals from body length
  tiny: 1,
  small: 2,
  medium: 3,
  large: 5,
  xlarge: 8,
};

function extractRepoName(repositoryUrl: string): string {
  const parts = repositoryUrl.split("/");
  return parts[parts.length - 1];
}

export function estimateTaskDuration(issue: GitHubIssue): number {
  let hours = 4; // base estimate

  const bodyLength = (issue.body || "").length;
  if (bodyLength > 2000) hours += 8;
  else if (bodyLength > 1000) hours += 4;
  else if (bodyLength > 500) hours += 2;

  const text = `${issue.title} ${issue.body || ""}`.toLowerCase();
  const labelNames = issue.labels.map((l) => l.name.toLowerCase());

  // Check for time labels like "Time: <1 Week"
  for (const label of labelNames) {
    if (label.includes("time:")) {
      if (label.includes("1 hour")) return 1;
      if (label.includes("2 hour")) return 2;
      if (label.includes("4 hour")) return 4;
      if (label.includes("1 day")) return 8;
      if (label.includes("2 day")) return 16;
      if (label.includes("3 day")) return 24;
      if (label.includes("1 week")) return 40;
      if (label.includes("2 week")) return 80;
    }
  }

  // Complexity from label sizes
  for (const label of labelNames) {
    for (const [size, multiplier] of Object.entries(COMPLEXITY_SIGNALS)) {
      if (label.includes(size)) {
        hours = 4 * multiplier;
      }
    }
  }

  // Checklist items add time
  const checklistItems = (text.match(/- \[[ x]\]/g) || []).length;
  hours += checklistItems * 0.5;

  // Code blocks suggest implementation complexity
  const codeBlocks = (text.match(/```/g) || []).length / 2;
  hours += codeBlocks * 2;

  // Cap estimates
  return Math.min(Math.max(Math.round(hours), 1), 80);
}

export function inferPriority(issue: GitHubIssue): Priority {
  const text = `${issue.title} ${issue.body || ""}`.toLowerCase();
  const labelNames = issue.labels.map((l) => l.name.toLowerCase());

  // Check labels first — they're the most reliable signal
  for (const label of labelNames) {
    if (label.includes("priority")) {
      if (label.includes("urgent") || label.includes("0") || label.includes("critical"))
        return "urgent";
      if (label.includes("1") || label.includes("high")) return "high";
      if (label.includes("2") || label.includes("medium")) return "medium";
      if (label.includes("3") || label.includes("low")) return "low";
    }
  }

  // Keyword analysis
  const scores: Record<Priority, number> = { urgent: 0, high: 0, medium: 0, low: 0 };

  for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        scores[priority as Priority] += 1;
      }
      for (const label of labelNames) {
        if (label.includes(keyword)) {
          scores[priority as Priority] += 2;
        }
      }
    }
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return "medium";

  for (const [priority, score] of Object.entries(scores)) {
    if (score === maxScore) return priority as Priority;
  }

  return "medium";
}

function computeBusinessValue(issue: GitHubIssue, priority: Priority): number {
  const priorityValues: Record<Priority, number> = {
    urgent: 10,
    high: 7,
    medium: 5,
    low: 2,
  };

  let value = priorityValues[priority];

  // Issues with more reactions are more valuable
  const text = (issue.body || "").toLowerCase();
  if (text.includes("revenue") || text.includes("customer")) value += 3;
  if (text.includes("security") || text.includes("vulnerability")) value += 4;
  if (issue.labels.some((l) => l.name.toLowerCase().includes("price"))) value += 2;

  return Math.min(value, 10);
}

export function issuesToSprintTasks(issues: GitHubIssue[]): SprintTask[] {
  return issues.map((issue) => {
    const priority = inferPriority(issue);
    const estimatedHours = estimateTaskDuration(issue);
    const businessValue = computeBusinessValue(issue, priority);

    return {
      id: generateId(),
      github_issue_id: issue.id,
      title: issue.title,
      description: (issue.body || "").slice(0, 500),
      priority,
      status: issue.assignee ? "in_progress" : "backlog",
      estimated_hours: estimatedHours,
      assignee: issue.assignee
        ? {
            id: issue.assignee.id.toString(),
            login: issue.assignee.login,
            name: issue.assignee.name || issue.assignee.login,
            avatar_url: issue.assignee.avatar_url,
            role: "developer",
            capacity_hours: 40,
            skills: [],
            current_load: 0,
          }
        : null,
      labels: issue.labels.map((l) => l.name),
      repo: extractRepoName(issue.repository_url),
      issue_number: issue.number,
      issue_url: issue.html_url,
      sprint_day: 0,
      complexity: Math.ceil(estimatedHours / 8),
      business_value: businessValue,
    };
  });
}

export function membersToTeam(members: GitHubUser[]): TeamMember[] {
  return members.map((member) => ({
    id: member.id.toString(),
    login: member.login,
    name: member.name || member.login,
    avatar_url: member.avatar_url,
    role: "developer",
    capacity_hours: 40,
    skills: [],
    current_load: 0,
  }));
}

export function autoAssignTasks(
  tasks: SprintTask[],
  team: TeamMember[],
  sprintDays: number
): SprintTask[] {
  if (team.length === 0) return tasks;

  // Sort tasks by priority weight * business value (descending)
  const priorityWeight: Record<Priority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const sortedTasks = [...tasks].sort(
    (a, b) =>
      b.business_value * priorityWeight[b.priority] -
      a.business_value * priorityWeight[a.priority]
  );

  // Track team member load
  const memberLoad: Record<string, number> = {};
  for (const member of team) {
    memberLoad[member.id] = 0;
  }

  const dailyCapacity = 6; // productive hours per day
  const sprintCapacity = dailyCapacity * sprintDays;

  return sortedTasks.map((task) => {
    if (task.assignee) return task;

    // Find team member with lowest current load
    let bestMember = team[0];
    let lowestLoad = Infinity;

    for (const member of team) {
      const load = memberLoad[member.id] || 0;
      if (load < lowestLoad && load + task.estimated_hours <= sprintCapacity) {
        lowestLoad = load;
        bestMember = member;
      }
    }

    memberLoad[bestMember.id] = (memberLoad[bestMember.id] || 0) + task.estimated_hours;

    // Assign to sprint day based on current load
    const sprintDay = Math.min(
      Math.floor(memberLoad[bestMember.id] / dailyCapacity) + 1,
      sprintDays
    );

    return {
      ...task,
      assignee: { ...bestMember, current_load: memberLoad[bestMember.id] },
      sprint_day: sprintDay,
      status: "todo" as const,
    };
  });
}

export function generateSprint(
  tasks: SprintTask[],
  team: TeamMember[],
  sprintDays: number = 10
): Sprint {
  const assignedTasks = autoAssignTasks(tasks, team, sprintDays);
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + sprintDays);

  return {
    id: generateId(),
    name: `Sprint ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    start_date: now.toISOString(),
    end_date: endDate.toISOString(),
    tasks: assignedTasks,
    team,
    velocity: assignedTasks.reduce((sum, t) => sum + t.estimated_hours, 0),
    capacity_hours: team.length * 6 * sprintDays,
  };
}

export function calculateROI(
  tasks: SprintTask[],
  teamSize: number
): ROIMetrics {
  const tasksAnalyzed = tasks.length;
  const minutesPerTaskAssignment = 5;
  const minutesPerPrioritization = 3;
  const minutesPerSprintPlanning = 15;

  const hoursAssignment = (tasksAnalyzed * minutesPerTaskAssignment) / 60;
  const hoursPrioritization = (tasksAnalyzed * minutesPerPrioritization) / 60;
  const hoursPlanning = (tasksAnalyzed * minutesPerSprintPlanning) / 60;
  const totalHoursSaved = hoursAssignment + hoursPrioritization + hoursPlanning;

  const managerHourlyRate = 85;
  const sprintsPerMonth = 2;
  const monthlySavings = totalHoursSaved * managerHourlyRate * sprintsPerMonth;

  return {
    tasks_analyzed: tasksAnalyzed,
    hours_saved_planning: Math.round(hoursPlanning * 10) / 10,
    hours_saved_assignment: Math.round(hoursAssignment * 10) / 10,
    total_hours_saved: Math.round(totalHoursSaved * 10) / 10,
    cost_savings_monthly: Math.round(monthlySavings),
    cost_savings_annual: Math.round(monthlySavings * 12),
    manager_hourly_rate: managerHourlyRate,
    tasks_auto_prioritized: tasksAnalyzed,
    sprint_plans_generated: 1,
    efficiency_gain_percent: Math.min(
      Math.round((totalHoursSaved / (teamSize * 40)) * 100 * 10) / 10,
      95
    ),
  };
}
