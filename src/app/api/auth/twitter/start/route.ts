"useimport { NextResponse } from 'next/server';client";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

/**
 * Twitter OAuth Start - Initiates OAuth flow to Twitter
 * Required by spec for X/Twitter platform
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/auth/signin?error=authentication_required", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    // Generate a secure random state
    const state = randomBytes(32).toString('hex');
    
    // Store state in a cookie for verification in the callback
    const stateExpiry = new Date();
    stateExpiry.setTime(stateExpiry.getTime() + 10 * 60 * 1000); // 10 minutes
    
    const params = new URLSearchParams({
      client_id: process.env.TWITTER_CLIENT_ID!,
      redirect_uri: process.env.TWITTER_REDIRECT_URI!,
      response_type: "code",
      scope: "tweet.read users.read offline.access",
      state: state,
      code_challenge: state, // For PKCE - should use a proper SHA256 hash in production
      code_challenge_method: "plain",
    });
    
    // Create the response with the redirect
    const response = NextResponse.redirect(`https://twitter.com/i/oauth2/authorize?${params.toString()}`);
    
    // Set a cookie to store the state
    response.cookies.set("twitter_oauth_state", state, {
      expires: stateExpiry,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });
    
    return response;
  } catch (error) {
    console.error("Error in Twitter OAuth start:", error);
    return NextResponse.redirect(new URL("/settings?error=twitter_oauth_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }
}
