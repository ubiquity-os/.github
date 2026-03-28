import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No authorization code provided." }, { status: 400 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Server misconfiguration. Missing OAuth credentials." }, { status: 500 });
  }

  // Shadow PR Constraint 1: Strict Timeout Wrappers
  const fetchWithTimeout = async (url: string, init: RequestInit = {}, timeoutMs = 10000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  };

  try {
    const tokenResponse = await fetchWithTimeout("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    // Shadow PR Constraint 2: Strict HTTP Status & Payload Validation
    if (!tokenResponse.ok || tokenData.error) {
      return NextResponse.json(
        { error: tokenData.error_description || "Token exchange failed with GitHub API." },
        { status: 400 }
      );
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return NextResponse.json({ error: "Missing access token in GitHub payload." }, { status: 400 });
    }

    const userResponse = await fetchWithTimeout("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const user = await userResponse.json();

    // Validating user retrieval securely
    if (!userResponse.ok || !user?.login) {
      return NextResponse.json({ error: "Failed to securely retrieve GitHub user profile." }, { status: 401 });
    }

    // Success response - Setting HTTP-Only JWT Cookie
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    
    const response = NextResponse.redirect(url);
    response.cookies.set("github_session_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 1 Week expiration timeframe
    });

    return response;

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json({ error: "GitHub API request timed out after 10 seconds. Terminating connection." }, { status: 504 });
    }
    return NextResponse.json({ error: "Internal Server Error during OAuth data extraction." }, { status: 500 });
  }
}
