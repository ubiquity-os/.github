# PR-1 Delivery Checklist

## A. Landing + conversion
- [ ] Hero section with clear manager-focused value prop
- [ ] Single primary CTA: Sign in with GitHub
- [ ] Lightweight metrics/social proof placeholders

## B. Authentication
- [ ] GitHub OAuth app configured
- [ ] `/auth/github/start` + `/auth/github/callback` implemented
- [ ] Session token issuance and secure cookie handling

## C. Organization connect
- [ ] Load authenticated user's GitHub orgs
- [ ] Multi-select repositories for first ingestion
- [ ] Trigger ingestion job and show job state

## D. Ingestion skeleton
- [ ] Queue worker receives org/repo payload
- [ ] Fetch open issues metadata from GitHub API
- [ ] Persist issue snapshot and member signals

## E. Definition of done
- [ ] New user can go from landing to job queued without manual DB/API steps
- [ ] Basic logs and error handling exist for each onboarding step
- [ ] README includes local run instructions
