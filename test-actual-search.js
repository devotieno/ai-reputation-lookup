// Test actual SerpAPI call with improved strategies
require('dotenv').config({ path: '.env.local' });

async function testActualSearch() {
  const serpApiKey = process.env.SERPAPI_KEY; // Fixed: use SERPAPI_KEY not SERPAPI_API_KEY
  
  if (!serpApiKey) {
    console.log("❌ No SERPAPI_KEY found in .env.local");
    return;
  }
  
  console.log("🔍 Testing actual SerpAPI calls for @BrianOt61224764\n");
  
  // Test the most promising strategies
  const testStrategies = [
    {
      name: "direct_profile_exact",
      query: "site:x.com/BrianOt61224764 OR site:twitter.com/BrianOt61224764"
    },
    {
      name: "username_broad_site", 
      query: '"BrianOt61224764" (site:x.com OR site:twitter.com)'
    },
    {
      name: "handle_search",
      query: '"@BrianOt61224764" OR "BrianOt61224764" site:x.com'
    }
  ];
  
  for (const strategy of testStrategies) {
    console.log(`\n🧪 Testing: ${strategy.name}`);
    console.log(`📝 Query: ${strategy.query}`);
    
    try {
      const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(strategy.query)}&api_key=${serpApiKey}&num=10`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      console.log(`📊 Status: ${response.status}`);
      
      if (data.organic_results && data.organic_results.length > 0) {
        console.log(`✅ Found ${data.organic_results.length} organic results`);
        
        // Filter for X.com/Twitter results
        const twitterResults = data.organic_results.filter(result => 
          result.link && (result.link.includes('x.com') || result.link.includes('twitter.com'))
        );
        
        if (twitterResults.length > 0) {
          console.log(`🐦 ${twitterResults.length} X/Twitter results:`);
          twitterResults.forEach((result, i) => {
            console.log(`   ${i + 1}. ${result.title}`);
            console.log(`      URL: ${result.link}`);
            console.log(`      Snippet: ${result.snippet || 'No snippet'}`);
            console.log('');
          });
        } else {
          console.log(`❌ No X/Twitter results in the ${data.organic_results.length} organic results`);
          // Show what we did find
          console.log(`📋 Sample results found:`);
          data.organic_results.slice(0, 3).forEach((result, i) => {
            console.log(`   ${i + 1}. ${result.title} - ${result.link}`);
          });
        }
      } else if (data.error) {
        console.log(`❌ API Error: ${data.error}`);
      } else {
        console.log(`❌ No organic results found`);
        console.log(`📋 Response keys: ${Object.keys(data).join(', ')}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Request failed: ${error.message}`);
    }
  }
  
  console.log(`\n🔍 Search completed. If no X/Twitter results were found, this explains why the analysis showed 'no data available'.`);
  console.log(`💡 The profile might exist but not be indexed by Google search or have limited public visibility through search APIs.`);
}

// Mock fetch for Node.js environment
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testActualSearch().catch(console.error);
