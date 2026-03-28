import { NextResponse } from "next/server";

export async function GET() {
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;

  if (!GITHUB_CLIENT_ID) {
    return NextResponse.json({ error: "Missing GitHub Client ID configuration." }, { status: 500 });
  }

  const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/github/callback`);
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=read:user user:email repo`;

  return NextResponse.redirect(githubAuthUrl);
}
