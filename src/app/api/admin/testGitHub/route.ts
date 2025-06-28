import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || 'octocat';
    
    console.log('Testing GitHub API for username:', username);
    console.log('GITHUB_TOKEN available:', !!process.env.GITHUB_TOKEN);
    
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ai-reputation-lookup/0.1'
    };
    
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }
    
    // Test rate limit first
    const rateLimitResponse = await fetch('https://api.github.com/rate_limit', { headers });
    
    if (!rateLimitResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Rate limit check failed: ${rateLimitResponse.status}`,
        tokenSet: !!process.env.GITHUB_TOKEN
      });
    }
    
    const rateLimit = await rateLimitResponse.json();
    
    // Test user fetch
    const userResponse = await fetch(`https://api.github.com/users/${username}`, { headers });
    
    if (!userResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `User fetch failed: ${userResponse.status}`,
        tokenSet: !!process.env.GITHUB_TOKEN,
        rateLimit: rateLimit.resources.core
      });
    }
    
    const user = await userResponse.json();
    
    return NextResponse.json({
      success: true,
      message: 'GitHub API integration working!',
      tokenSet: !!process.env.GITHUB_TOKEN,
      rateLimit: {
        remaining: rateLimit.resources.core.remaining,
        limit: rateLimit.resources.core.limit,
        reset: new Date(rateLimit.resources.core.reset * 1000).toISOString()
      },
      sampleUser: {
        login: user.login,
        name: user.name,
        public_repos: user.public_repos,
        followers: user.followers
      }
    });
    
  } catch (error) {
    console.error('GitHub API test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      tokenSet: !!process.env.GITHUB_TOKEN
    });
  }
}
