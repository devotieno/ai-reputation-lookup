"useimport { NextResponse } from 'next/server';client";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

/**
 * Reddit OAuth Start - Initiates OAuth flow to Reddit
 * Required by spec for Reddit platform
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
      client_id: process.env.REDDIT_CLIENT_ID!,
      response_type: "code",
      state: state,
      redirect_uri: process.env.REDDIT_REDIRECT_URI!,
      duration: "permanent",
      scope: "identity read history",
    });
    
    // Create the response with the redirect
    const response = NextResponse.redirect(`https://www.reddit.com/api/v1/authorize?${params.toString()}`);
    
    // Set a cookie to store the state
    response.cookies.set("reddit_oauth_state", state, {
      expires: stateExpiry,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });
    
    return response;
  } catch (error) {
    console.error("Error in Reddit OAuth start:", error);
    return NextResponse.redirect(new URL("/settings?error=reddit_oauth_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }
}
