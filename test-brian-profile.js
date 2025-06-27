// Test script to demonstrate analysis with real Twitter profile
// Profile: @BrianOt61224764 (otieno.swe)

const testUserInput = {
  name: "Brian Otieno",
  twitter: "@BrianOt61224764",
  linkedin: "", // Not provided
  reddit: "", // Not provided  
  youtube: "", // Not provided
  instagram: "", // Not provided
  email: "", // Not provided
  photo: null
};

console.log("Test User Input for Analysis:");
console.log(JSON.stringify(testUserInput, null, 2));

console.log("\nExpected Analysis Sources:");
console.log("- Twitter: Public posts, profile info, social activity");
console.log("- SerpAPI: Web search results for 'Brian Otieno'");
console.log("- Perplexity: AI-enhanced reputation analysis");
console.log("- General web search: Professional presence, BRIOTIFX project");

console.log("\nProfile Information Available:");
console.log("- Software Developer");
console.log("- Built BRIOTIFX - Forex Trade Signals Software"); 
console.log("- Website: briotifx.vercel.app");
console.log("- Twitter: @BrianOt61224764");
console.log("- Joined: September 2021");
console.log("- Following: 246, Followers: 115");

console.log("\nAnalysis Categories that would be generated:");
console.log("1. Professionalism - Software development background");
console.log("2. Tone & Language - Communication style in posts");
console.log("3. Sentiment Analysis - Overall positive/negative content");
console.log("4. Consistency - Professional consistency across platforms");
console.log("5. Authenticity - Real person vs. automated/fake");
console.log("6. Social Risk Profile - Any controversial content");
console.log("7. Online Exposure Level - Public visibility and reach");
console.log("8. Positive Reputation Markers - Technical skills, projects");
