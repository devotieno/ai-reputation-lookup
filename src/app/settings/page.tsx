"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function Settings() {
  const { data: session, status } = useSession();
  const [userConnections, setUserConnections] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  
  // Helper function to safely get string values
  const getStringValue = (key: string): string => {
    const value = userConnections[key];
    return typeof value === 'string' ? value : '';
  };
  
  // Helper function to safely get date values
  const getDateValue = (key: string): string => {
    const value = userConnections[key];
    if (!value) return '';
    try {
      return new Date(value as string).toLocaleDateString();
    } catch {
      return '';
    }
  };
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/api/auth/signin?callbackUrl=/settings");
    }
  }, [status]);
  
  useEffect(() => {
    if (session?.user?.id) {
      const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", session.user.id));
          if (userDoc.exists()) {
            setUserConnections(userDoc.data());
          }
          setLoading(false);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setLoading(false);
        }
      };
      
      fetchUserData();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);
  
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  if (!session) {
    return null; // This should never happen because of the redirect
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link href="/" className="text-blue-500 hover:text-blue-700">← Back to Home</Link>
      </div>
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
      <p className="mb-8">Signed in as {session?.user?.email}</p>
      
      <h2 className="text-2xl font-semibold mb-4">Connect Social Accounts</h2>
      <p className="mb-4">Connect your social accounts to enable deeper data analysis.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Instagram */}
        <div className="border rounded-lg p-4">
          <h3 className="text-xl mb-2">Instagram</h3>
          {userConnections.instagramAccessToken ? (
            <div>
              <p className="text-green-600">✓ Connected as @{getStringValue('instagramUsername')}</p>
              <p className="text-sm text-gray-500">Connected on {getDateValue('instagramConnectedAt')}</p>
            </div>
          ) : (
            <Link href="/api/auth/instagram/start" className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Connect Instagram
            </Link>
          )}
        </div>
        
        {/* Twitter */}
        <div className="border rounded-lg p-4">
          <h3 className="text-xl mb-2">Twitter</h3>
          {userConnections.twitterAccessToken ? (
            <div>
              <p className="text-green-600">✓ Connected as @{getStringValue('twitterUsername')}</p>
              <p className="text-sm text-gray-500">Connected on {getDateValue('twitterConnectedAt')}</p>
            </div>
          ) : (
            <Link href="/api/auth/twitter/start" className="inline-block bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500">
              Connect Twitter
            </Link>
          )}
        </div>
        
        {/* LinkedIn */}
        <div className="border rounded-lg p-4">
          <h3 className="text-xl mb-2">LinkedIn</h3>
          {userConnections.linkedinAccessToken ? (
            <div>
              <p className="text-green-600">✓ Connected as {getStringValue('linkedinName')}</p>
              <p className="text-sm text-gray-500">Connected on {getDateValue('linkedinConnectedAt')}</p>
            </div>
          ) : (
            <Link href="/api/auth/linkedin/start" className="inline-block bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800">
              Connect LinkedIn
            </Link>
          )}
        </div>
        
        {/* Reddit */}
        <div className="border rounded-lg p-4">
          <h3 className="text-xl mb-2">Reddit</h3>
          {userConnections.redditAccessToken ? (
            <div>
              <p className="text-green-600">✓ Connected as u/{getStringValue('redditUsername')}</p>
              <p className="text-sm text-gray-500">Connected on {getDateValue('redditConnectedAt')}</p>
            </div>
          ) : (
            <Link href="/api/auth/reddit/start" className="inline-block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              Connect Reddit
            </Link>
          )}
        </div>
        
        {/* YouTube */}
        <div className="border rounded-lg p-4">
          <h3 className="text-xl mb-2">YouTube</h3>
          {userConnections.youtubeAccessToken ? (
            <div>
              <p className="text-green-600">✓ Connected to {getStringValue('youtubeChannelTitle')}</p>
              <p className="text-sm text-gray-500">Connected on {getDateValue('youtubeConnectedAt')}</p>
            </div>
          ) : (
            <Link href="/api/auth/youtube/start" className="inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Connect YouTube
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}