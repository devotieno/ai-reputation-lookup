import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { randomBytes } from "crypto";

/**
 * Instagram OAuth Start - Initiates OAuth flow to Instagram
 * Required by spec for Instagram platform
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
      client_id: process.env.INSTAGRAM_CLIENT_ID!,
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
      response_type: "code",
      scope: "user_profile,user_media",
      state: state,
    });
    
    // Create the response with the redirect
    const response = NextResponse.redirect(`https://api.instagram.com/oauth/authorize?${params.toString()}`);
    
    // Set a cookie to store the state
    response.cookies.set("instagram_oauth_state", state, {
      expires: stateExpiry,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });
    
    return response;
  } catch (error) {
    console.error("Error in Instagram OAuth start:", error);
    return NextResponse.redirect(new URL("/settings?error=instagram_oauth_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }
}
