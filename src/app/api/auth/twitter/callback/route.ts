import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

/**
 * Twitter OAuth Callback - Handles OAuth response from Twitter
 * Required by spec for X/Twitter platform
 */
export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/auth/signin?error=authentication_required", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    const userId = session.user.id;
    
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Check for errors from Twitter
    if (error) {
      console.error("Twitter OAuth error:", error);
      return NextResponse.redirect(new URL("/settings?error=twitter_oauth_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    if (!code) {
      return NextResponse.redirect(new URL("/settings?error=twitter_oauth_failed&reason=no_code", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    // Verify state against stored cookie state
    const stateCookie = request.cookies.get('twitter_oauth_state')?.value;
    if (!stateCookie || stateCookie !== state) {
      return NextResponse.redirect(new URL("/settings?error=twitter_oauth_failed&reason=invalid_state", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    // Exchange code for access token
    const params = new URLSearchParams({
      client_id: process.env.TWITTER_CLIENT_ID!,
      client_secret: process.env.TWITTER_CLIENT_SECRET!,
      grant_type: "authorization_code",
      redirect_uri: process.env.TWITTER_REDIRECT_URI!,
      code: code,
      code_verifier: state, // In a real app, this should be stored and retrieved from a secure place
    });
    
    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    
    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("Twitter OAuth token error:", errorText);
      return NextResponse.redirect(new URL("/settings?error=twitter_oauth_failed&reason=token_exchange_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    const tokenData = await tokenRes.json();
    
    // Get user info from Twitter API
    const userInfoRes = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url,username", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    
    if (!userInfoRes.ok) {
      const errorText = await userInfoRes.text();
      console.error("Twitter API error:", errorText);
      return NextResponse.redirect(new URL("/settings?error=twitter_oauth_failed&reason=user_info_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    const userInfoData = await userInfoRes.json();
    const userInfo = userInfoData.data;
    
    // Store in Firestore
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    await setDoc(userDocRef, {
      ...(userDoc.exists() ? userDoc.data() : {}),
      twitterAccessToken: tokenData.access_token,
      twitterRefreshToken: tokenData.refresh_token,
      twitterTokenExpiry: Date.now() + (tokenData.expires_in * 1000),
      twitterId: userInfo.id,
      twitterUsername: userInfo.username,
      twitterProfileImage: userInfo.profile_image_url,
      twitterConnectedAt: new Date().toISOString(),
    }, { merge: true });
    
    // Create response with redirect and clear state cookie
    const response = NextResponse.redirect(new URL("/settings?status=twitter_connected", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    
    // Clear the state cookie
    response.cookies.delete("twitter_oauth_state");
    
    return response;
  } catch (error) {
    console.error("Error in Twitter OAuth callback:", error);
    return NextResponse.redirect(new URL("/settings?error=twitter_connection_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }
}
