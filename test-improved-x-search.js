// Test the improved multi-strategy X.com search
require('dotenv').config({ path: '.env.local' });

// Import the Twitter functions directly
// Since we can't import ES modules in Node.js easily, we'll test the core logic
async function testSearchStrategies() {
  // Test data
  const testQueries = [
    "@BrianOt61224764",
    "BrianOt61224764", 
    "x.com/BrianOt61224764",
    "Brian Otieno"
  ];

  console.log("Testing search strategy generation:");

  testQueries.forEach(query => {
    console.log(`\n=== Testing query: "${query}" ===`);
    
    const strategies = generateSearchStrategies(query);
    strategies.forEach((strategy, index) => {
      console.log(`${index + 1}. ${strategy.name}: ${strategy.query}`);
    });
  });
  
  // Test actual SerpAPI call with one strategy
  if (process.env.SERPAPI_API_KEY) {
    console.log("\n=== Testing actual SerpAPI call ===");
    
    const testQuery = '"BrianOt61224764" site:x.com';
    const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(testQuery)}&api_key=${process.env.SERPAPI_API_KEY}&num=5`;
    
    console.log(`Searching: ${testQuery}`);
    
    try {
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log(`Results found: ${data.organic_results ? data.organic_results.length : 0}`);
      
      if (data.organic_results && data.organic_results.length > 0) {
        data.organic_results.forEach((result, index) => {
          if (result.link && (result.link.includes('x.com') || result.link.includes('twitter.com'))) {
            console.log(`${index + 1}. ${result.title}`);
            console.log(`   URL: ${result.link}`);
            console.log(`   Snippet: ${result.snippet || 'No snippet'}`);
            console.log('');
          }
        });
      } else {
        console.log("No relevant X.com results found");
      }
    } catch (error) {
      console.error("SerpAPI test failed:", error.message);
    }
  } else {
    console.log("No SERPAPI_API_KEY found - skipping live test");
  }
}

// Generate multiple search strategies for better coverage
function generateSearchStrategies(query) {
  const strategies = [];
  
  // Extract username if it's a handle or URL
  let username = null;
  if (query.includes('@')) {
    username = query.replace('@', '').trim();
  } else if (query.includes('twitter.com/') || query.includes('x.com/')) {
    username = query.split(/(?:twitter\.com\/|x\.com\/)/)[1]?.split('/')[0]?.trim();
  } else if (/^[a-zA-Z0-9_]+$/.test(query.trim()) && !query.includes(' ')) {
    username = query.trim();
  }
  
  if (username) {
    // Strategy 1: Direct profile search
    strategies.push({
      name: "direct_profile",
      query: `site:x.com/${username}`,
      targetUsername: username
    });
    
    // Strategy 2: Username in quotes with site restriction
    strategies.push({
      name: "quoted_username",
      query: `"${username}" site:x.com`,
      targetUsername: username
    });
    
    // Strategy 3: Broader search with username
    strategies.push({
      name: "broad_username",
      query: `${username} site:x.com -search -home -settings`,
      targetUsername: username
    });
  } else {
    // For name searches, try different approaches
    const cleanName = query.trim();
    
    // Strategy 1: Exact name in quotes
    strategies.push({
      name: "exact_name",
      query: `"${cleanName}" site:x.com`,
      targetUsername: null
    });
    
    // Strategy 2: Name without quotes
    strategies.push({
      name: "loose_name", 
      query: `${cleanName} site:x.com -search -home -settings`,
      targetUsername: null
    });
    
    // Strategy 3: Add profile-related terms
    strategies.push({
      name: "profile_enhanced",
      query: `"${cleanName}" site:x.com (profile OR bio OR about)`,
      targetUsername: null
    });
  }
  
  return strategies;
}

// Run the test
testSearchStrategies().catch(console.error);
