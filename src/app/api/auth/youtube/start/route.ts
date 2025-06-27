"useimport { NextResponse } from 'next/server';client";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

/**
 * YouTube OAuth Start - Initiates OAuth flow to YouTube
 * Required by spec for YouTube platform
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
      client_id: process.env.YOUTUBE_CLIENT_ID!,
      redirect_uri: process.env.YOUTUBE_REDIRECT_URI!,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/youtube.readonly",
      state: state,
      access_type: "offline",
      prompt: "consent",
    });
    
    // Create the response with the redirect
    const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/auth?${params.toString()}`);
    
    // Set a cookie to store the state
    response.cookies.set("youtube_oauth_state", state, {
      expires: stateExpiry,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });
    
    return response;
  } catch (error) {
    console.error("Error in YouTube OAuth start:", error);
    return NextResponse.redirect(new URL("/settings?error=youtube_oauth_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }
}
