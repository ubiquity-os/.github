import { GitHubUser, GitHubOrg, GitHubRepo, GitHubIssue } from "@/types";

const GITHUB_API = "https://api.github.com";

export class GitHubClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${GITHUB_API}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github.v3+json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  }

  async getUser(): Promise<GitHubUser> {
    return this.fetch<GitHubUser>("/user");
  }

  async getUserOrgs(): Promise<GitHubOrg[]> {
    return this.fetch<GitHubOrg[]>("/user/orgs?per_page=100");
  }

  async getOrgRepos(org: string): Promise<GitHubRepo[]> {
    const repos: GitHubRepo[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const batch = await this.fetch<GitHubRepo[]>(
        `/orgs/${org}/repos?per_page=${perPage}&page=${page}&sort=updated&direction=desc`
      );
      repos.push(...batch);
      if (batch.length < perPage) break;
      page++;
    }

    return repos;
  }

  async getRepoIssues(owner: string, repo: string): Promise<GitHubIssue[]> {
    const issues: GitHubIssue[] = [];
    let page = 1;
    const perPage = 100;

    while (page <= 3) {
      const batch = await this.fetch<GitHubIssue[]>(
        `/repos/${owner}/${repo}/issues?state=open&per_page=${perPage}&page=${page}&sort=updated`
      );
      issues.push(...batch);
      if (batch.length < perPage) break;
      page++;
    }

    return issues.filter((issue) => !issue.html_url.includes("/pull/"));
  }

  async getOrgMembers(org: string): Promise<GitHubUser[]> {
    return this.fetch<GitHubUser[]>(`/orgs/${org}/members?per_page=100`);
  }

  async getOrgIssues(org: string, repos?: string[]): Promise<GitHubIssue[]> {
    const orgRepos = repos
      ? repos.map((r) => ({ name: r } as GitHubRepo))
      : await this.getOrgRepos(org);

    const topRepos = orgRepos.slice(0, 10);
    const allIssues: GitHubIssue[] = [];

    const results = await Promise.allSettled(
      topRepos.map((repo) => this.getRepoIssues(org, repo.name))
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        allIssues.push(...result.value);
      }
    }

    return allIssues.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }
}

export function getGitHubOAuthUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "DEMO_MODE";
  const redirectUri = process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI || "";
  const scope = "read:org repo read:user";

  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
}
