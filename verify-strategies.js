// Quick test of improved X.com search strategies
console.log("Testing improved X.com search strategies for @BrianOt61224764");

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
    // Strategy 1: Direct profile search with exact URL
    strategies.push({
      name: "direct_profile_exact",
      query: `site:x.com/${username} OR site:twitter.com/${username}`,
      targetUsername: username
    });
    
    // Strategy 2: Username with broader site search
    strategies.push({
      name: "username_broad_site", 
      query: `"${username}" (site:x.com OR site:twitter.com)`,
      targetUsername: username
    });
    
    // Strategy 3: Username without site restriction (but filtered later)
    strategies.push({
      name: "username_general",
      query: `"${username}" x.com OR "${username}" twitter.com`,
      targetUsername: username
    });
    
    // Strategy 4: Username with profile-related terms
    strategies.push({
      name: "username_with_profile",
      query: `"${username}" (profile OR bio) site:x.com`,
      targetUsername: username
    });
    
    // Strategy 5: Handle-specific search (for @handles)
    if (query.includes('@')) {
      strategies.push({
        name: "handle_search",
        query: `"@${username}" OR "${username}" site:x.com`,
        targetUsername: username
      });
    }
  }
  
  return strategies;
}

const testQuery = "@BrianOt61224764";
const strategies = generateSearchStrategies(testQuery);

console.log(`Generated ${strategies.length} improved search strategies:\n`);

strategies.forEach((strategy, index) => {
  console.log(`${index + 1}. ${strategy.name}:`);
  console.log(`   Query: ${strategy.query}`);
  console.log(`   Target: ${strategy.targetUsername || 'N/A'}`);
  console.log(`   URL: https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(strategy.query)}&api_key=YOUR_KEY`);
  console.log('');
});

console.log("These improved strategies should have better coverage for finding X.com profiles.");
