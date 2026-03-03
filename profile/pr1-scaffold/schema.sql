-- PR-1 scaffold schema for Sprint Dashboard onboarding

create table if not exists users (
  id uuid primary key,
  github_user_id text unique not null,
  github_login text not null,
  created_at timestamptz default now()
);

create table if not exists organizations (
  id uuid primary key,
  github_org_id text unique not null,
  github_login text not null,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists organization_memberships (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz default now(),
  unique(user_id, organization_id)
);

create table if not exists repositories (
  id uuid primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  github_repo_id text unique not null,
  owner_login text not null,
  name text not null,
  full_name text not null,
  created_at timestamptz default now()
);

create table if not exists ingestion_jobs (
  id uuid primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  requested_by uuid not null references users(id) on delete cascade,
  status text not null check (status in ('queued','running','completed','failed')),
  progress numeric(5,2) not null default 0,
  message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
