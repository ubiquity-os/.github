import { Sprint, SprintTask, TeamMember, ROIMetrics } from "@/types";

const DEMO_TEAM: TeamMember[] = [
  {
    id: "1",
    login: "whilefoo",
    name: "While Foo",
    avatar_url: "https://avatars.githubusercontent.com/u/139262667",
    role: "Full Stack Developer",
    capacity_hours: 40,
    skills: ["TypeScript", "React", "Node.js"],
    current_load: 28,
  },
  {
    id: "2",
    login: "gentlementlegen",
    name: "Gentlementlegen",
    avatar_url: "https://avatars.githubusercontent.com/u/9807008",
    role: "Backend Developer",
    capacity_hours: 40,
    skills: ["TypeScript", "Solidity", "APIs"],
    current_load: 32,
  },
  {
    id: "3",
    login: "0x4007",
    name: "0x4007",
    avatar_url: "https://avatars.githubusercontent.com/u/4975670",
    role: "Tech Lead",
    capacity_hours: 32,
    skills: ["Architecture", "TypeScript", "DevOps"],
    current_load: 24,
  },
  {
    id: "4",
    login: "sshivaditya",
    name: "Shivaditya",
    avatar_url: "https://avatars.githubusercontent.com/u/53604338",
    role: "Frontend Developer",
    capacity_hours: 40,
    skills: ["React", "CSS", "TypeScript"],
    current_load: 20,
  },
  {
    id: "5",
    login: "ubq-testing",
    name: "UBQ Testing",
    avatar_url: "https://avatars.githubusercontent.com/u/140627813",
    role: "QA Engineer",
    capacity_hours: 40,
    skills: ["Testing", "CI/CD", "Automation"],
    current_load: 16,
  },
];

function makeTasks(): SprintTask[] {
  const tasks: SprintTask[] = [
    {
      id: "t1",
      github_issue_id: 101,
      title: "Fix OAuth token refresh race condition",
      description:
        "When multiple API calls fire simultaneously and the token expires, each call triggers a refresh causing 401 cascading failures.",
      priority: "urgent",
      status: "in_progress",
      estimated_hours: 6,
      assignee: DEMO_TEAM[0],
      labels: ["bug", "Priority: 1 (Normal)", "Time: <1 Day"],
      repo: "ubiquity-os-kernel",
      issue_number: 142,
      issue_url: "https://github.com/ubiquity-os/ubiquity-os-kernel/issues/142",
      sprint_day: 1,
      complexity: 3,
      business_value: 9,
    },
    {
      id: "t2",
      github_issue_id: 102,
      title: "Implement permit2 reward signature verification",
      description:
        "Add cryptographic verification for permit2 signatures used in the bounty reward system to prevent double-spending.",
      priority: "high",
      status: "todo",
      estimated_hours: 16,
      assignee: DEMO_TEAM[1],
      labels: ["enhancement", "Priority: 2 (Medium)", "Time: <1 Week"],
      repo: "conversation-rewards",
      issue_number: 87,
      issue_url: "https://github.com/ubiquity-os/conversation-rewards/issues/87",
      sprint_day: 1,
      complexity: 5,
      business_value: 8,
    },
    {
      id: "t3",
      github_issue_id: 103,
      title: "Sprint management dashboard MVP",
      description:
        "Build a landing page and dashboard for sprint management with GitHub OAuth, calendar view, and ROI metrics.",
      priority: "high",
      status: "in_progress",
      estimated_hours: 40,
      assignee: DEMO_TEAM[3],
      labels: ["feature", "Priority: 3 (High)", "Price: 1800 USD"],
      repo: ".github",
      issue_number: 14,
      issue_url: "https://github.com/ubiquity-os/.github/issues/14",
      sprint_day: 1,
      complexity: 8,
      business_value: 10,
    },
    {
      id: "t4",
      github_issue_id: 104,
      title: "Add Supabase vector embeddings for issue similarity",
      description:
        "Use pgvector to store embeddings of issue descriptions and find similar/duplicate issues automatically.",
      priority: "medium",
      status: "todo",
      estimated_hours: 12,
      assignee: DEMO_TEAM[2],
      labels: ["enhancement", "ai", "Time: <1 Week"],
      repo: "ubiquity-os-kernel",
      issue_number: 198,
      issue_url: "https://github.com/ubiquity-os/ubiquity-os-kernel/issues/198",
      sprint_day: 3,
      complexity: 4,
      business_value: 7,
    },
    {
      id: "t5",
      github_issue_id: 105,
      title: "E2E test suite for plugin installation flow",
      description:
        "Create comprehensive Playwright tests covering the full plugin installation, configuration, and uninstallation flows.",
      priority: "medium",
      status: "backlog",
      estimated_hours: 8,
      assignee: DEMO_TEAM[4],
      labels: ["testing", "Time: <1 Day"],
      repo: "ubiquity-os-kernel",
      issue_number: 205,
      issue_url: "https://github.com/ubiquity-os/ubiquity-os-kernel/issues/205",
      sprint_day: 4,
      complexity: 3,
      business_value: 5,
    },
    {
      id: "t6",
      github_issue_id: 106,
      title: "Refactor command parser to support slash subcommands",
      description:
        "The current command parser only supports single-level commands. Need to support /assign user, /priority set high, etc.",
      priority: "medium",
      status: "todo",
      estimated_hours: 10,
      assignee: DEMO_TEAM[0],
      labels: ["enhancement", "refactor"],
      repo: "ubiquity-os-kernel",
      issue_number: 210,
      issue_url: "https://github.com/ubiquity-os/ubiquity-os-kernel/issues/210",
      sprint_day: 3,
      complexity: 4,
      business_value: 6,
    },
    {
      id: "t7",
      github_issue_id: 107,
      title: "Update documentation for new plugin API v2",
      description:
        "Comprehensive documentation update covering the new plugin API, including migration guide from v1.",
      priority: "low",
      status: "backlog",
      estimated_hours: 6,
      assignee: null,
      labels: ["documentation"],
      repo: ".github",
      issue_number: 15,
      issue_url: "https://github.com/ubiquity-os/.github/issues/15",
      sprint_day: 5,
      complexity: 2,
      business_value: 3,
    },
    {
      id: "t8",
      github_issue_id: 108,
      title: "Implement webhook retry with exponential backoff",
      description:
        "When GitHub webhook delivery fails, implement retry logic with exponential backoff and dead letter queue.",
      priority: "high",
      status: "todo",
      estimated_hours: 8,
      assignee: DEMO_TEAM[1],
      labels: ["bug", "reliability"],
      repo: "ubiquity-os-kernel",
      issue_number: 215,
      issue_url: "https://github.com/ubiquity-os/ubiquity-os-kernel/issues/215",
      sprint_day: 5,
      complexity: 3,
      business_value: 8,
    },
    {
      id: "t9",
      github_issue_id: 109,
      title: "Add rate limiting to public API endpoints",
      description:
        "Implement token bucket rate limiting for all public-facing API endpoints to prevent abuse.",
      priority: "high",
      status: "backlog",
      estimated_hours: 6,
      assignee: DEMO_TEAM[2],
      labels: ["security", "infrastructure"],
      repo: "ubiquity-os-kernel",
      issue_number: 220,
      issue_url: "https://github.com/ubiquity-os/ubiquity-os-kernel/issues/220",
      sprint_day: 7,
      complexity: 2,
      business_value: 9,
    },
    {
      id: "t10",
      github_issue_id: 110,
      title: "Optimize GitHub API calls with conditional requests",
      description:
        "Use ETags and If-None-Match headers to reduce API quota consumption by ~60%.",
      priority: "medium",
      status: "backlog",
      estimated_hours: 4,
      assignee: null,
      labels: ["performance", "optimization"],
      repo: "ubiquity-os-kernel",
      issue_number: 225,
      issue_url: "https://github.com/ubiquity-os/ubiquity-os-kernel/issues/225",
      sprint_day: 8,
      complexity: 2,
      business_value: 5,
    },
    {
      id: "t11",
      github_issue_id: 111,
      title: "Design system: Create shared component library",
      description:
        "Extract common UI components into a shared package for consistent styling across all UbiquityOS frontends.",
      priority: "medium",
      status: "todo",
      estimated_hours: 20,
      assignee: DEMO_TEAM[3],
      labels: ["enhancement", "design"],
      repo: ".github",
      issue_number: 16,
      issue_url: "https://github.com/ubiquity-os/.github/issues/16",
      sprint_day: 6,
      complexity: 5,
      business_value: 6,
    },
    {
      id: "t12",
      github_issue_id: 112,
      title: "Fix flaky CI tests in conversation-rewards",
      description:
        "Several tests intermittently fail due to timing issues with mock database transactions.",
      priority: "medium",
      status: "backlog",
      estimated_hours: 4,
      assignee: DEMO_TEAM[4],
      labels: ["bug", "ci", "testing"],
      repo: "conversation-rewards",
      issue_number: 92,
      issue_url: "https://github.com/ubiquity-os/conversation-rewards/issues/92",
      sprint_day: 8,
      complexity: 2,
      business_value: 4,
    },
  ];

  return tasks;
}

const DEMO_TASKS = makeTasks();

export function getDemoSprint(): Sprint {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 10);

  return {
    id: "demo-sprint-1",
    name: `Sprint ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    start_date: now.toISOString(),
    end_date: endDate.toISOString(),
    tasks: DEMO_TASKS,
    team: DEMO_TEAM,
    velocity: DEMO_TASKS.reduce((sum, t) => sum + t.estimated_hours, 0),
    capacity_hours: DEMO_TEAM.length * 6 * 10,
  };
}

export function getDemoMetrics(): ROIMetrics {
  const tasks = DEMO_TASKS.length;
  return {
    tasks_analyzed: tasks,
    hours_saved_planning: 4.5,
    hours_saved_assignment: 3.0,
    total_hours_saved: 12.8,
    cost_savings_monthly: 2176,
    cost_savings_annual: 26112,
    manager_hourly_rate: 85,
    tasks_auto_prioritized: tasks,
    sprint_plans_generated: 1,
    efficiency_gain_percent: 34.2,
  };
}

export function getDemoTeam(): TeamMember[] {
  return DEMO_TEAM;
}

export function getDemoTasks(): SprintTask[] {
  return DEMO_TASKS;
}

export { DEMO_TEAM, DEMO_TASKS };
