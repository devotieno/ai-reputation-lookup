// Test YouTube search for "otieno swe" channel
const { fetchYouTubeData } = require('./src/lib/apiClients/youtube.ts');

async function testYouTubeSearch() {
  console.log('🔍 Testing YouTube Search for "otieno swe"');
  console.log('=====================================\n');
  
  // Test different query formats that might be used
  const testQueries = [
    'otieno swe',
    '@otienoswe', 
    'otienoswe',
    'otieno swe software',
    'youtube.com/@otienoswe'
  ];
  
  for (const query of testQueries) {
    console.log(`Testing query: "${query}"`);
    console.log('----------------------------');
    
    try {
      const results = await fetchYouTubeData(query);
      console.log(`Results found: ${results.length}`);
      
      if (results.length > 0) {
        console.log('✅ SUCCESS - Found results!');
        results.slice(0, 2).forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.title || result.content}`);
          console.log(`     URL: ${result.url}`);
          console.log(`     Strategy: ${result.searchStrategy}`);
          console.log(`     Channel: ${result.channelTitle || 'N/A'}`);
        });
      } else {
        console.log('❌ No results found');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log();
  }
}

// Check environment setup
function checkEnvironment() {
  console.log('🔧 Environment Check');
  console.log('===================');
  console.log(`YouTube API Key: ${process.env.YOUTUBE_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`SerpAPI Key: ${process.env.SERPAPI_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log();
  
  if (!process.env.YOUTUBE_API_KEY && !process.env.SERPAPI_KEY) {
    console.log('⚠️  Warning: Neither YouTube API key nor SerpAPI key is set.');
    console.log('   The search will fail without at least one of these APIs.');
    console.log();
  }
}

async function main() {
  checkEnvironment();
  await testYouTubeSearch();
  
  console.log('📝 Recommendations:');
  console.log('==================');
  console.log('1. Set YOUTUBE_API_KEY in .env.local for direct YouTube Data API access');
  console.log('2. Ensure SERPAPI_KEY is set for fallback Google search');
  console.log('3. Try the search with "@otienoswe" format for best results');
  console.log('4. Channel content about "SaaS", "forex", "software" should be discoverable');
}

main().catch(console.error);
