const https = require('https');

// Test GitHub API directly
async function testGitHubAPI() {
  console.log('Testing GitHub API...');
  
  // Test 1: Test a known public user (torvalds)
  const testUsername = 'torvalds';
  
  try {
    console.log(`\n1. Testing profile for ${testUsername}:`);
    const profileData = await fetchGitHubProfile(testUsername);
    console.log('Profile data:', profileData ? 'SUCCESS' : 'FAILED');
    if (profileData) {
      console.log('  - Username:', profileData.author);
      console.log('  - Public repos:', profileData.stats?.public_repos);
    }
    
    console.log(`\n2. Testing events for ${testUsername}:`);
    const eventsData = await fetchGitHubEvents(testUsername);
    console.log('Events data:', eventsData.length > 0 ? `SUCCESS (${eventsData.length} events)` : 'FAILED or EMPTY');
    
    console.log(`\n3. Testing repos for ${testUsername}:`);
    const reposData = await fetchGitHubRepos(testUsername);
    console.log('Repos data:', reposData.length > 0 ? `SUCCESS (${reposData.length} repos)` : 'FAILED or EMPTY');
    
    // Test 2: Test username extraction
    console.log('\n4. Testing username extraction:');
    const testQueries = [
      'torvalds',
      'https://github.com/torvalds',
      'github.com/torvalds',
      'https://github.com/torvalds/linux'
    ];
    
    testQueries.forEach(query => {
      const username = extractGitHubUsername(query);
      console.log(`  "${query}" → "${username}"`);
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Copy the functions from the GitHub client
function extractGitHubUsername(query) {
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

async function fetchGitHubProfile(username) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/users/${username}`,
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ai-reputation-lookup/0.1'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error(`GitHub profile API error: ${res.statusCode}`);
          console.error('Response:', data);
          resolve(null);
          return;
        }
        
        try {
          const profile = JSON.parse(data);
          resolve({
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
          });
        } catch (error) {
          console.error('Error parsing profile JSON:', error);
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
      resolve(null);
    });
    
    req.end();
  });
}

async function fetchGitHubEvents(username) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/users/${username}/events/public`,
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ai-reputation-lookup/0.1'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error(`GitHub events API error: ${res.statusCode}`);
          resolve([]);
          return;
        }
        
        try {
          const events = JSON.parse(data);
          if (!Array.isArray(events)) {
            resolve([]);
            return;
          }
          
          resolve(events.slice(0, 10).map((event) => ({
            content: `${event.type} on ${event.repo?.name || 'unknown repository'}`,
            sourceType: "github",
            platform: "GitHub", 
            date: event.created_at,
            url: event.repo ? `https://github.com/${event.repo.name}` : `https://github.com/${username}`,
            author: username,
            title: `GitHub Activity: ${event.type}`,
            eventType: event.type,
            repo: event.repo?.name
          })));
        } catch (error) {
          console.error('Error parsing events JSON:', error);
          resolve([]);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
      resolve([]);
    });
    
    req.end();
  });
}

async function fetchGitHubRepos(username) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/users/${username}/repos?sort=updated&per_page=10`,
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ai-reputation-lookup/0.1'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error(`GitHub repos API error: ${res.statusCode}`);
          resolve([]);
          return;
        }
        
        try {
          const repos = JSON.parse(data);
          if (!Array.isArray(repos)) {
            resolve([]);
            return;
          }
          
          resolve(repos.slice(0, 5).map((repo) => ({
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
          })));
        } catch (error) {
          console.error('Error parsing repos JSON:', error);
          resolve([]);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
      resolve([]);
    });
    
    req.end();
  });
}

// Run the test
testGitHubAPI().then(() => {
  console.log('\nTest completed.');
}).catch(error => {
  console.error('Test error:', error);
});
