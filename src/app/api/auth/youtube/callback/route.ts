import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

/**
 * YouTube OAuth Callback - Handles OAuth response from YouTube (Google)
 * Required by spec for YouTube platform
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
    
    // Check for errors from Google
    if (error) {
      console.error("YouTube OAuth error:", error);
      return NextResponse.redirect(new URL("/settings?error=youtube_oauth_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    if (!code) {
      return NextResponse.redirect(new URL("/settings?error=youtube_oauth_failed&reason=no_code", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    // Verify state against stored cookie state
    const stateCookie = request.cookies.get('youtube_oauth_state')?.value;
    if (!stateCookie || stateCookie !== state) {
      return NextResponse.redirect(new URL("/settings?error=youtube_oauth_failed&reason=invalid_state", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    // Exchange code for access token
    const tokenParams = new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      grant_type: "authorization_code",
      redirect_uri: process.env.YOUTUBE_REDIRECT_URI!,
      code: code,
    });
    
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    });
    
    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("YouTube OAuth token error:", errorText);
      return NextResponse.redirect(new URL("/settings?error=youtube_oauth_failed&reason=token_exchange_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    const tokenData = await tokenRes.json();
    
    // Get user channel info
    const channelRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    
    if (!channelRes.ok) {
      const errorText = await channelRes.text();
      console.error("YouTube API error:", errorText);
      return NextResponse.redirect(new URL("/settings?error=youtube_oauth_failed&reason=channel_info_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    const channelData = await channelRes.json();
    const channel = channelData.items?.[0] || {};
    
    // Store in Firestore
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    await setDoc(userDocRef, {
      ...(userDoc.exists() ? userDoc.data() : {}),
      youtubeAccessToken: tokenData.access_token,
      youtubeRefreshToken: tokenData.refresh_token,
      youtubeTokenExpiry: Date.now() + (tokenData.expires_in * 1000),
      youtubeChannelId: channel.id || null,
      youtubeChannelTitle: channel.snippet?.title || null,
      youtubeProfileImage: channel.snippet?.thumbnails?.default?.url || null,
      youtubeConnectedAt: new Date().toISOString(),
    }, { merge: true });
    
    // Create response with redirect and clear state cookie
    const response = NextResponse.redirect(new URL("/settings?success=youtube_connected", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    
    response.cookies.set("youtube_oauth_state", "", {
      expires: new Date(0),
      path: "/",
    });
    
    return response;
  } catch (error) {
    console.error("Error in YouTube OAuth callback:", error);
    return NextResponse.redirect(new URL("/settings?error=youtube_oauth_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }
}
