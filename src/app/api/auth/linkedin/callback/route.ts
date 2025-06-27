import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

/**
 * LinkedIn OAuth Callback - Handles OAuth response from LinkedIn
 * Required by spec for LinkedIn platform
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
    
    // Check for errors from LinkedIn
    if (error) {
      console.error("LinkedIn OAuth error:", error);
      return NextResponse.redirect(new URL("/settings?error=linkedin_oauth_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    if (!code) {
      return NextResponse.redirect(new URL("/settings?error=linkedin_oauth_failed&reason=no_code", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    // Verify state against stored cookie state
    const stateCookie = request.cookies.get('linkedin_oauth_state')?.value;
    if (!stateCookie || stateCookie !== state) {
      return NextResponse.redirect(new URL("/settings?error=linkedin_oauth_failed&reason=invalid_state", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    // Exchange code for access token
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    });
    
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    });
    
    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("LinkedIn OAuth token error:", errorText);
      return NextResponse.redirect(new URL("/settings?error=linkedin_oauth_failed&reason=token_exchange_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    const tokenData = await tokenRes.json();
    
    // Get user info from LinkedIn API (using OpenID Connect)
    const userInfoRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    
    if (!userInfoRes.ok) {
      const errorText = await userInfoRes.text();
      console.error("LinkedIn API error:", errorText);
      return NextResponse.redirect(new URL("/settings?error=linkedin_oauth_failed&reason=user_info_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }
    
    const userInfo = await userInfoRes.json();
    
    let profileImageUrl = null;
    try {
      profileImageUrl = userInfo.picture || null;
    } catch {
      console.log("Could not extract LinkedIn profile picture");
    }
    
    // Store in Firestore
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    await setDoc(userDocRef, {
      ...(userDoc.exists() ? userDoc.data() : {}),
      linkedinAccessToken: tokenData.access_token,
      linkedinTokenExpiry: Date.now() + (tokenData.expires_in * 1000),
      linkedinId: userInfo.sub,
      linkedinName: userInfo.name,
      linkedinEmail: userInfo.email,
      linkedinProfileImage: profileImageUrl,
      linkedinConnectedAt: new Date().toISOString(),
    }, { merge: true });
    
    // Create response with redirect and clear state cookie
    const response = NextResponse.redirect(new URL("/settings?success=linkedin_connected", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    
    response.cookies.set("linkedin_oauth_state", "", {
      expires: new Date(0),
      path: "/",
    });
    
    return response;
  } catch (error) {
    console.error("Error in LinkedIn OAuth callback:", error);
    return NextResponse.redirect(new URL("/settings?error=linkedin_oauth_failed", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }
}
