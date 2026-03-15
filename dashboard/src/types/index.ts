export type Priority = "urgent" | "high" | "medium" | "low";

export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

export interface GitHubOrg {
  id: number;
  login: string;
  avatar_url: string;
  description: string | null;
  repos_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  open_issues_count: number;
  language: string | null;
  updated_at: string;
  html_url: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  assignee: GitHubUser | null;
  assignees: GitHubUser[];
  created_at: string;
  updated_at: string;
  html_url: string;
  repository_url: string;
  milestone: {
    title: string;
    due_on: string | null;
  } | null;
}

export interface TeamMember {
  id: string;
  login: string;
  name: string;
  avatar_url: string;
  role: string;
  capacity_hours: number;
  skills: string[];
  current_load: number;
}

export interface SprintTask {
  id: string;
  github_issue_id: number;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  estimated_hours: number;
  assignee: TeamMember | null;
  labels: string[];
  repo: string;
  issue_number: number;
  issue_url: string;
  sprint_day: number;
  complexity: number;
  business_value: number;
}

export interface Sprint {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  tasks: SprintTask[];
  team: TeamMember[];
  velocity: number;
  capacity_hours: number;
}

export interface ROIMetrics {
  tasks_analyzed: number;
  hours_saved_planning: number;
  hours_saved_assignment: number;
  total_hours_saved: number;
  cost_savings_monthly: number;
  cost_savings_annual: number;
  manager_hourly_rate: number;
  tasks_auto_prioritized: number;
  sprint_plans_generated: number;
  efficiency_gain_percent: number;
}

export interface SprintPlanRequest {
  org: string;
  repos: string[];
  sprint_length_days: number;
  team_size: number;
}

export interface SprintPlanResponse {
  sprint: Sprint;
  metrics: ROIMetrics;
}
