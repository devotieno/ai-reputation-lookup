import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

/**
 * Instagram OAuth Callback - Handles OAuth response from Instagram
 * Required by spec for Instagram platform
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
    
    // Check for errors from Instagram
    if (error) {
      console.error("Instagram OAuth error:", error);
      return NextResponse.redirect(new URL("/settings?error=instagram_oauth_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    // Validate required parameters
    if (!code || !state) {
      console.error("Missing required OAuth parameters:", { code: !!code, state: !!state });
      return NextResponse.redirect(new URL("/settings?error=instagram_oauth_failed&reason=missing_parameters", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    // Verify state parameter (CSRF protection)
    const stateCookie = request.cookies.get("instagram_oauth_state");
    if (!stateCookie || stateCookie.value !== state) {
      console.error("State mismatch:", { cookieState: stateCookie?.value, urlState: state });
      return NextResponse.redirect(new URL("/settings?error=instagram_oauth_failed&reason=state_mismatch", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    console.log("Instagram OAuth callback received for user:", userId);
    
    // Exchange authorization code for access token
    const params = new URLSearchParams({
      client_id: process.env.INSTAGRAM_CLIENT_ID!,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
      grant_type: "authorization_code",
      redirect_uri: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/instagram/callback`,
      code: code,
    });
    
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    
    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("Instagram OAuth token error:", errorText);
      return NextResponse.redirect(new URL("/settings?error=instagram_oauth_failed&reason=token_exchange_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    const tokenResponse = await tokenRes.json();
    const { access_token, user_id } = tokenResponse;
    
    // For Basic Display API, we can store the short-lived token
    // In production, you might want to exchange for a long-lived token
    
    // Store in Firestore
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await setDoc(userRef, {
        ...userDoc.data(),
        instagramAccessToken: access_token,
        instagramUserId: user_id,
        instagramConnectedAt: new Date().toISOString()
      }, { merge: true });
    } else {
      await setDoc(userRef, {
        instagramAccessToken: access_token,
        instagramUserId: user_id,
        instagramConnectedAt: new Date().toISOString()
      }, { merge: true });
    }

    console.log("Instagram connection saved for user:", userId);
    
    // Clear the state cookie and redirect to settings
    const response = NextResponse.redirect(new URL("/settings?success=instagram_connected", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    response.cookies.set("instagram_oauth_state", "", { maxAge: 0 });
    
    return response;
  } catch (error) {
    console.error("Error in Instagram OAuth callback:", error);
    return NextResponse.redirect(new URL("/settings?error=instagram_oauth_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }
}
