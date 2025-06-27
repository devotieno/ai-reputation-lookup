// Test the Twitter client directly using Node.js modules
// This will test our improved multi-strategy search

async function testTwitterClient() {
  // Simulate the environment
  process.env.SERPAPI_API_KEY = "1281742d08d043a00548b8cd76771a3363ed7ec5be6e51bc1008eb1d0d63f6f9";
  
  console.log("Testing the improved Twitter client logic...");
  
  // Simulate the generateSearchStrategies function
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
    }
    
    return strategies;
  }
  
  // Test with Brian's handle
  const testQuery = "@BrianOt61224764";
  const strategies = generateSearchStrategies(testQuery);
  
  console.log(`Generated ${strategies.length} search strategies for "${testQuery}":`);
  strategies.forEach((strategy, index) => {
    console.log(`${index + 1}. ${strategy.name}: ${strategy.query}`);
  });
  
  // Test one strategy with actual API call
  if (strategies.length > 0) {
    const testStrategy = strategies[1]; // Try the quoted_username strategy
    console.log(`\nTesting strategy: ${testStrategy.name}`);
    console.log(`Query: ${testStrategy.query}`);
    
    const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(testStrategy.query)}&api_key=${process.env.SERPAPI_API_KEY}&num=10`;
    
    try {
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      console.log(`\nAPI Response Status: ${response.status}`);
      console.log(`Response keys: ${Object.keys(data).join(', ')}`);
      
      if (data.organic_results && data.organic_results.length > 0) {
        console.log(`Found ${data.organic_results.length} results`);
        
        // Filter for X.com results
        const xResults = data.organic_results.filter(result => 
          result.link && (result.link.includes('x.com') || result.link.includes('twitter.com'))
        );
        
        console.log(`X.com/Twitter results: ${xResults.length}`);
        xResults.forEach((result, i) => {
          console.log(`${i + 1}. ${result.title}`);
          console.log(`   URL: ${result.link}`);
          console.log(`   Snippet: ${result.snippet || 'No snippet'}`);
          console.log('');
        });
      } else {
        console.log("No organic results found");
        if (data.error) {
          console.log(`Error: ${data.error}`);
        }
      }
    } catch (error) {
      console.error(`API call failed: ${error.message}`);
    }
  }
}

// Mock fetch for Node.js environment
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testTwitterClient().catch(console.error);
