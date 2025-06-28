// Quick GitHub API test
const { config } = require('dotenv');
config({ path: '.env.local' });

async function testGitHub() {
  const token = process.env.GITHUB_TOKEN;
  console.log('GitHub Token:', token ? `✅ Set (${token.length} chars)` : '❌ Not found');
  
  if (!token) return;
  
  try {
    const response = await fetch('https://api.github.com/rate_limit', {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'ai-reputation-lookup'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Test: SUCCESS');
      console.log(`Rate Limit: ${data.resources.core.remaining}/${data.resources.core.limit}`);
    } else {
      console.log('❌ API Test: FAILED', response.status);
    }
  } catch (error) {
    console.log('❌ API Test: ERROR', error.message);
  }
}

testGitHub();
