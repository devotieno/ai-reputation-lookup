// Test script to verify GitHub API token setup
require('dotenv').config({ path: '.env.local' });

async function testGitHubToken() {
  console.log('Testing GitHub API token setup...\n');
  
  // Check if token is set
  const token = process.env.GITHUB_TOKEN;
  
  if (!token || token === 'your_github_token_here') {
    console.error('❌ GITHUB_TOKEN is not set or still has placeholder value');
    console.log('\nPlease:');
    console.log('1. Generate a GitHub Personal Access Token at: https://github.com/settings/tokens');
    console.log('2. Update GITHUB_TOKEN in .env.local with your actual token');
    console.log('3. Run this test again');
    return;
  }
  
  console.log('✅ GITHUB_TOKEN is set');
  console.log(`Token length: ${token.length} characters (should be 40 for classic tokens)`);
  
  // Test API call with token
  try {
    console.log('\nTesting authenticated API request...');
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${token}`,
      'User-Agent': 'ai-reputation-lookup/0.1'
    };
    
    // Test with GitHub's rate limit endpoint
    const response = await fetch('https://api.github.com/rate_limit', { headers });
    
    if (!response.ok) {
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      
      if (response.status === 401) {
        console.log('\nThis usually means:');
        console.log('- The token is invalid or expired');
        console.log('- The token format is incorrect');
        console.log('- The token has been revoked');
      }
      return;
    }
    
    const rateLimit = await response.json();
    
    console.log('✅ Authenticated API request successful!');
    console.log('\nRate limit status:');
    console.log(`- Core API: ${rateLimit.resources.core.remaining}/${rateLimit.resources.core.limit} requests remaining`);
    console.log(`- Search API: ${rateLimit.resources.search.remaining}/${rateLimit.resources.search.limit} requests remaining`);
    console.log(`- Rate limit resets at: ${new Date(rateLimit.resources.core.reset * 1000).toLocaleString()}`);
    
    // Test fetching a public user (using octocat as example)
    console.log('\nTesting user data fetch...');
    const userResponse = await fetch('https://api.github.com/users/octocat', { headers });
    
    if (userResponse.ok) {
      const user = await userResponse.json();
      console.log('✅ User data fetch successful!');
      console.log(`Sample: ${user.name} (@${user.login}) - ${user.public_repos} public repos`);
    } else {
      console.log('⚠️  User data fetch failed, but token is valid');
    }
    
    console.log('\n🎉 GitHub API integration is ready!');
    
  } catch (error) {
    console.error('❌ Error testing GitHub API:', error.message);
  }
}

testGitHubToken();
