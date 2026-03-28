import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;

  // CodeRabbit Security Fix: CSRF State Payload Validation
  if (!code || !returnedState || returnedState !== storedState) {
    return NextResponse.json({ error: "Invalid state parameter or missing authorization code. CSRF attack prevented." }, { status: 400 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Server misconfiguration. Missing OAuth credentials." }, { status: 500 });
  }

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

    if (!userResponse.ok || !user?.login) {
      return NextResponse.json({ error: "Failed to securely retrieve GitHub user profile." }, { status: 401 });
    }

    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    
    const response = NextResponse.redirect(url);
    
    // CodeRabbit Security Fix: Avoid raw access token leakage by storing a secure session hash
    const secureSessionIdentifier = crypto.createHash('sha256').update(accessToken + process.env.GITHUB_CLIENT_SECRET).digest('hex');
    response.cookies.set("ubiquity_session", secureSessionIdentifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return response;

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: "GitHub API request timed out after 10 seconds. Terminating connection." }, { status: 504 });
    }
    return NextResponse.json({ error: "Internal Server Error during OAuth data extraction." }, { status: 500 });
  }
}
