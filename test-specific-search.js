// Test the new X.com search approach for Brian's specific handle
async function testSpecificSearch() {
  const serpApiKey = "1281742d08d043a00548b8cd76771a3363ed7ec5be6e51bc1008eb1d0d63f6f9";
  
  console.log("Testing new X.com search approach for Brian's handle...\n");
  
  // Test searches that should work based on our findings
  const searches = [
    '"BrianOt61224764" site:x.com',
    '"otieno.swe" site:x.com', 
    '"BRIOTIFX" site:x.com',
    'BrianOt61224764 site:x.com',
    'otieno.swe site:x.com'
  ];
  
  for (let i = 0; i < searches.length; i++) {
    const searchQuery = searches[i];
    console.log(`${i + 1}. Testing: ${searchQuery}`);
    
    const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(searchQuery)}&api_key=${serpApiKey}`;
    
    try {
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.organic_results && data.organic_results.length > 0) {
        console.log(`   ✅ Found ${data.organic_results.length} results`);
        
        // Show first few results that contain x.com
        const xResults = data.organic_results.filter(r => r.link && (r.link.includes('x.com') || r.link.includes('twitter.com')));
        console.log(`   📱 X/Twitter results: ${xResults.length}`);
        
        xResults.slice(0, 2).forEach((result, idx) => {
          console.log(`      ${idx + 1}. ${result.title}`);
          console.log(`         ${result.link}`);
          console.log(`         ${result.snippet?.substring(0, 100)}...`);
        });
      } else {
        console.log(`   ❌ No results found`);
      }
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
    
    // Small delay to be nice to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testSpecificSearch();
