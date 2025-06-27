// Test script for enhanced platform implementations
const { fetchYouTubeData } = require('./src/lib/apiClients/youtube.ts');
const { fetchRedditData } = require('./src/lib/apiClients/reddit.ts');
const { fetchGithubData } = require('./src/lib/apiClients/github.ts');
const { fetchInstagramData } = require('./src/lib/apiClients/instagram.ts');

async function testEnhancedPlatforms() {
  console.log('🧪 Testing Enhanced Platform Implementations\n');
  
  // Test YouTube with channel search
  console.log('📺 Testing YouTube enhanced search...');
  try {
    const youtubeResults = await fetchYouTubeData('@mkbhd'); // Popular tech reviewer
    console.log(`YouTube results: ${youtubeResults.length} items found`);
    if (youtubeResults.length > 0) {
      console.log(`- First result strategy: ${youtubeResults[0].searchStrategy}`);
      console.log(`- First result channel: ${youtubeResults[0].channelTitle}`);
    }
  } catch (error) {
    console.log(`YouTube test error: ${error.message}`);
  }
  
  console.log();
  
  // Test Reddit with username search
  console.log('🤖 Testing Reddit enhanced search...');
  try {
    const redditResults = await fetchRedditData('spez'); // Reddit CEO username
    console.log(`Reddit results: ${redditResults.length} items found`);
    if (redditResults.length > 0) {
      console.log(`- First result strategy: ${redditResults[0].searchStrategy}`);
      console.log(`- First result author: ${redditResults[0].author}`);
    }
  } catch (error) {
    console.log(`Reddit test error: ${error.message}`);
  }
  
  console.log();
  
  // Test GitHub with enhanced profile fetch
  console.log('🐙 Testing GitHub enhanced search...');
  try {
    const githubResults = await fetchGithubData('torvalds'); // Linux creator
    console.log(`GitHub results: ${githubResults.length} items found`);
    if (githubResults.length > 0) {
      console.log(`- First result type: ${githubResults[0].title}`);
      console.log(`- Profile stats available: ${!!githubResults[0].stats}`);
    }
  } catch (error) {
    console.log(`GitHub test error: ${error.message}`);
  }
  
  console.log();
  
  // Test Instagram (should return explanation)
  console.log('📷 Testing Instagram implementation...');
  try {
    const instagramResults = await fetchInstagramData('@instagram');
    console.log(`Instagram results: ${instagramResults.length} items found`);
    if (instagramResults.length > 0) {
      console.log(`- Explanation provided: ${!!instagramResults[0].isExplanation}`);
      console.log(`- Platform: ${instagramResults[0].platform}`);
    }
  } catch (error) {
    console.log(`Instagram test error: ${error.message}`);
  }
  
  console.log('\n✅ Enhanced platform testing complete!');
}

testEnhancedPlatforms().catch(console.error);
