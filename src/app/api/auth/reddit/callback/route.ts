import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

/**
 * Reddit OAuth Callback - Handles OAuth response from Reddit
 * Required by spec for Reddit platform
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
    
    // Check for errors from Reddit
    if (error) {
      console.error("Reddit OAuth error:", error);
      return NextResponse.redirect(new URL("/settings?error=reddit_oauth_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    if (!code) {
      return NextResponse.redirect(new URL("/settings?error=reddit_oauth_failed&reason=no_code", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    // Verify state against stored cookie state
    const stateCookie = request.cookies.get('reddit_oauth_state')?.value;
    if (!stateCookie || stateCookie !== state) {
      return NextResponse.redirect(new URL("/settings?error=reddit_oauth_failed&reason=invalid_state", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    // Exchange code for access token
    const tokenCredentials = Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64');
    
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: process.env.REDDIT_REDIRECT_URI!,
    });
    
    const tokenRes = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${tokenCredentials}`,
      },
      body: tokenParams.toString(),
    });
    
    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("Reddit OAuth token error:", errorText);
      return NextResponse.redirect(new URL("/settings?error=reddit_oauth_failed&reason=token_exchange_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    const tokenData = await tokenRes.json();
    
    // Get user info from Reddit API
    const userInfoRes = await fetch("https://oauth.reddit.com/api/v1/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'ai-reputation-lookup/1.0.0',
      },
    });
    
    if (!userInfoRes.ok) {
      const errorText = await userInfoRes.text();
      console.error("Reddit API error:", errorText);
      return NextResponse.redirect(new URL("/settings?error=reddit_oauth_failed&reason=user_info_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    const userInfo = await userInfoRes.json();
    
    // Store in Firestore
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    await setDoc(userDocRef, {
      ...(userDoc.exists() ? userDoc.data() : {}),
      redditAccessToken: tokenData.access_token,
      redditRefreshToken: tokenData.refresh_token,
      redditTokenExpiry: Date.now() + (tokenData.expires_in * 1000),
      redditId: userInfo.id,
      redditUsername: userInfo.name,
      redditProfileImage: userInfo.icon_img || null,
      redditConnectedAt: new Date().toISOString(),
    }, { merge: true });
    
    // Create response with redirect and clear state cookie
    const response = NextResponse.redirect(new URL("/settings?success=reddit_connected", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    
    response.cookies.set("reddit_oauth_state", "", {
      expires: new Date(0),
      path: "/",
    });
    
    return response;
  } catch (error) {
    console.error("Error in Reddit OAuth callback:", error);
    return NextResponse.redirect(new URL("/settings?error=reddit_oauth_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }
}
