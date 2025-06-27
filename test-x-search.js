// Test X.com/Twitter search with Brian's actual handle
const testQuery = "@BrianOt61224764";

console.log("Testing X.com search patterns:");

// Test different search approaches
const searches = [
  `from:BrianOt61224764`,
  `site:x.com BrianOt61224764`,
  `site:x.com/@BrianOt61224764`,
  `site:x.com "BrianOt61224764"`,
  `"otieno.swe" site:x.com`,
  `"BRIOTIFX" site:x.com`,
];

searches.forEach((search, index) => {
  console.log(`${index + 1}. Search query: ${search}`);
  console.log(`   URL: https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(search)}&api_key=YOUR_KEY`);
  console.log('');
});

console.log("Profile information to look for:");
console.log("- Handle: @BrianOt61224764");
console.log("- Display name: otieno.swe");
console.log("- Bio: Software Developer");
console.log("- Project: BRIOTIFX - Forex Trade Signals Software");
console.log("- Website: briotifx.vercel.app");
console.log("- Joined: September 2021");
console.log("- Following: 246, Followers: 115");
