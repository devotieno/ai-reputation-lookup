// Helper function to create GitHub API headers
function getGitHubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'ai-reputation-lookup/0.1'
  };
  
  // Add GitHub token if available for higher rate limits and access to more data
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    console.log('Using authenticated GitHub API requests');
  } else {
    console.warn('No GITHUB_TOKEN found - using unauthenticated requests (lower rate limits)');
  }
  
  return headers;
}

// Helper function to handle GitHub API responses
async function handleGitHubResponse(response: Response, endpoint: string) {
  if (!response.ok) {
    if (response.status === 403) {
      const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
      const rateLimitReset = response.headers.get('x-ratelimit-reset');
      console.error(`GitHub API rate limit exceeded for ${endpoint}. Remaining: ${rateLimitRemaining}, Reset: ${rateLimitReset}`);
    } else if (response.status === 404) {
      console.log(`GitHub resource not found: ${endpoint}`);
    } else {
      console.error(`GitHub API error for ${endpoint}: ${response.status} ${response.statusText}`);
    }
    return null;
  }
  
  const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
  if (rateLimitRemaining && parseInt(rateLimitRemaining) < 10) {
    console.warn(`GitHub API rate limit running low: ${rateLimitRemaining} requests remaining`);
  }
  
  return await response.json();
}

export async function fetchGithubData(query: string) {
  try {
    // Extract username from query (handle various formats)
    const username = extractGitHubUsername(query);
    
    if (!username) {
      console.error("Could not extract GitHub username from query:", query);
      return [];
    }

    console.log(`Fetching GitHub data for username: ${username}`);
    
    // Try multiple GitHub API endpoints for comprehensive data
    const results = await Promise.allSettled([
      fetchGitHubProfile(username),
      fetchGitHubEvents(username),
      fetchGitHubRepos(username)
    ]);
    
    let allData: any[] = [];
    
    // Process profile data
    if (results[0].status === 'fulfilled' && results[0].value) {
      allData.push(results[0].value);
    }
    
    // Process events data
    if (results[1].status === 'fulfilled' && results[1].value) {
      allData.push(...results[1].value);
    }
    
    // Process repos data  
    if (results[2].status === 'fulfilled' && results[2].value) {
      allData.push(...results[2].value);
    }
    
    if (allData.length === 0) {
      console.log(`No GitHub data found for username: ${username}`);
      
      // Return explanatory message if no data found
      return [{
        content: `Analysis attempted for GitHub user "${username}". No publicly accessible data was found. This could be due to: (1) The user account not existing or being suspended, (2) All repositories being private, (3) Limited recent activity, or (4) API rate limiting. GitHub profiles and public repositories are typically accessible through the public API.`,
        sourceType: "github",
        platform: "GitHub",
        date: new Date().toISOString(),
        url: `https://github.com/${username}`,
        author: username,
        title: "GitHub Analysis - Limited Data Access",
        isExplanation: true
      }];
    }
    
    console.log(`Successfully retrieved ${allData.length} GitHub items for: ${username}`);
    return allData;
    
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    return [];
  }
}

// Extract GitHub username from various query formats
function extractGitHubUsername(query: string): string | null {
  try {
    // Handle GitHub URLs
    if (query.includes('github.com/')) {
      const match = query.match(/github\.com\/([^\/\?]+)/);
      return match ? match[1] : null;
    }
    
    // Handle simple username (no spaces, valid GitHub username format)
    if (/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(query.trim())) {
      return query.trim();
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Fetch GitHub user profile information
async function fetchGitHubProfile(username: string) {
  try {
    const res = await fetch(`https://api.github.com/users/${username}`, {
      headers: getGitHubHeaders()
    });
    
    const profile = await handleGitHubResponse(res, `users/${username}`);
    
    if (!profile) {
      return null;
    }
    
    return {
      content: `GitHub Profile: ${profile.name || username} - ${profile.bio || 'No bio available'}. Public repos: ${profile.public_repos}, Followers: ${profile.followers}, Following: ${profile.following}. Member since: ${new Date(profile.created_at).getFullYear()}`,
      sourceType: "github",
      platform: "GitHub",
      date: profile.updated_at || profile.created_at,
      url: profile.html_url,
      author: username,
      title: "GitHub Profile",
      avatarUrl: profile.avatar_url,
      stats: {
        public_repos: profile.public_repos,
        followers: profile.followers,
        following: profile.following
      }
    };
  } catch (error) {
    console.error(`Error fetching GitHub profile for ${username}:`, error);
    return null;
  }
}

// Fetch GitHub user public events/activity
async function fetchGitHubEvents(username: string) {
  try {
    const res = await fetch(`https://api.github.com/users/${username}/events/public`, {
      headers: getGitHubHeaders()
    });
    
    const events = await handleGitHubResponse(res, `users/${username}/events/public`);
    
    if (!events || !Array.isArray(events)) {
      return [];
    }
    
    return events.slice(0, 10).map((event: any) => ({
      content: `${event.type} on ${event.repo?.name || 'unknown repository'} - ${getEventDescription(event)}`,
      sourceType: "github",
      platform: "GitHub", 
      date: event.created_at,
      url: event.repo ? `https://github.com/${event.repo.name}` : `https://github.com/${username}`,
      author: username,
      title: `GitHub Activity: ${event.type}`,
      eventType: event.type,
      repo: event.repo?.name
    }));
  } catch (error) {
    console.error(`Error fetching GitHub events for ${username}:`, error);
    return [];
  }
}

// Fetch GitHub user public repositories
async function fetchGitHubRepos(username: string) {
  try {
    const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, {
      headers: getGitHubHeaders()
    });
    
    const repos = await handleGitHubResponse(res, `users/${username}/repos`);
    
    if (!repos || !Array.isArray(repos)) {
      return [];
    }
    
    return repos.slice(0, 5).map((repo: any) => ({
      content: `Repository: ${repo.name} - ${repo.description || 'No description'}. Language: ${repo.language || 'Unknown'}, Stars: ${repo.stargazers_count}, Forks: ${repo.forks_count}`,
      sourceType: "github",
      platform: "GitHub",
      date: repo.updated_at,
      url: repo.html_url,
      author: username,
      title: `GitHub Repository: ${repo.name}`,
      repoStats: {
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language
      }
    }));
  } catch (error) {
    console.error(`Error fetching GitHub repos for ${username}:`, error);
    return [];
  }
}

// Get human-readable description of GitHub events
function getEventDescription(event: any): string {
  switch (event.type) {
    case 'PushEvent':
      const commits = event.payload?.commits?.length || 0;
      return `Pushed ${commits} commit${commits !== 1 ? 's' : ''}`;
    case 'CreateEvent':
      return `Created ${event.payload?.ref_type || 'repository'}`;
    case 'DeleteEvent':
      return `Deleted ${event.payload?.ref_type || 'branch'}`;
    case 'ForkEvent':
      return 'Forked repository';
    case 'WatchEvent':
      return 'Starred repository';
    case 'IssuesEvent':
      return `${event.payload?.action || 'Updated'} issue`;
    case 'PullRequestEvent':
      return `${event.payload?.action || 'Updated'} pull request`;
    case 'ReleaseEvent':
      return `${event.payload?.action || 'Created'} release`;
    default:
      return event.type.replace('Event', '');
  }
}