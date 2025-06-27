// Test Twitter/X data retrieval directly
const https = require('https');

async function testTwitterSearch() {
  const serpApiKey = "1281742d08d043a00548b8cd76771a3363ed7ec5be6e51bc1008eb1d0d63f6f9"; // Your API key
  const query = "from:BrianOt61224764";
  
  console.log("Testing Twitter search with SerpAPI...");
  console.log("Query:", query);
  
  // Test 1: Twitter engine
  const twitterUrl = `https://serpapi.com/search.json?engine=twitter&q=${encodeURIComponent(query)}&api_key=${serpApiKey}`;
  console.log("\n1. Testing Twitter engine:");
  console.log("URL:", twitterUrl);
  
  try {
    const response = await fetch(twitterUrl);
    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response keys:", Object.keys(data));
    
    if (data.tweets) {
      console.log("Found tweets:", data.tweets.length);
    } else {
      console.log("No tweets found");
      console.log("Full response:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("Twitter engine error:", error);
  }
  
  // Test 2: Google search for X.com
  const xUrl = `https://serpapi.com/search.json?engine=google&q=site:x.com ${encodeURIComponent(query)}&api_key=${serpApiKey}`;
  console.log("\n2. Testing X.com Google search:");
  console.log("URL:", xUrl);
  
  try {
    const response = await fetch(xUrl);
    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response keys:", Object.keys(data));
    
    if (data.organic_results) {
      console.log("Found organic results:", data.organic_results.length);
      data.organic_results.slice(0, 3).forEach((result, i) => {
        console.log(`  ${i+1}. ${result.title} - ${result.link}`);
      });
    } else {
      console.log("No organic results found");
      console.log("Full response:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("Google X.com search error:", error);
  }
  
  // Test 3: Simple name search
  const nameUrl = `https://serpapi.com/search.json?engine=google&q="Brian Otieno" site:x.com&api_key=${serpApiKey}`;
  console.log("\n3. Testing name search on X.com:");
  console.log("URL:", nameUrl);
  
  try {
    const response = await fetch(nameUrl);
    const data = await response.json();
    console.log("Status:", response.status);
    
    if (data.organic_results && data.organic_results.length > 0) {
      console.log("Found results for name search:", data.organic_results.length);
      data.organic_results.slice(0, 2).forEach((result, i) => {
        console.log(`  ${i+1}. ${result.title} - ${result.link}`);
      });
    } else {
      console.log("No results for name search");
    }
  } catch (error) {
    console.error("Name search error:", error);
  }
}

testTwitterSearch();
