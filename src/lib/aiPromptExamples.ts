// Example outputs and instructions for each reputation category
export const CATEGORY_EXAMPLES = {
  professionalism: `Example Output:\nEmployment history consistent across LinkedIn and interviews. Posts include detailed SaaS product management commentary. No major grammar issues observed.`,
  toneAndLanguage: `Example Output:\nConsistent professional tone in long-form posts. Occasional sarcasm directed at competitors on X. No profanity observed.`,
  sentiment: `Example Output:\nPositive coverage in multiple TechCrunch articles. One Reddit thread questioning transparency around recent fundraising (linked). No major controversies identified.`,
  consistency: `Example Output:\nPreviously advocated remote-first work model, reversed position in recent interviews. Issued public apology in 2022 regarding insensitive comment.`,
  authenticity: `Example Output:\nShares personal career journey in multiple interviews. Willing to discuss personal failures. High engagement on community-focused threads.`,
  socialRiskProfile: `Example Output:\nOne post from 2018 flagged for offensive racial slur (linked). No pattern of recurring problematic behavior detected.`,
  onlineExposure: `Example Output:\nFeatured in 4 major tech press articles, appeared on 2 podcasts, mentioned in multiple Reddit threads, and ranks on Google first page.`,
  positiveMarkers: `Example Output:\nSelected for Forbes 30 Under 30 (2023). Board member at local nonprofit. Verified LinkedIn and Twitter accounts.`
};

export const CATEGORY_INSTRUCTIONS = {
  professionalism: `Goal: Assess professionalism.\nAnalysis: Employment history, post content, grammar.\nLLM Task: Summarize professional tone and consistency.`,
  toneAndLanguage: `Goal: Analyze public communication style.\nAnalysis: Tone, language, aggression, humility, self-promotion.\nLLM Task: Analyze tone, highlight aggressive language, self-promotion.`,
  sentiment: `Goal: Assess public perception from third-party mentions.\nAnalysis: Press, praise, criticism, community sentiment, controversy.\nLLM Task: Aggregate sentiment, extract quotes.`,
  consistency: `Goal: Evaluate narrative stability.\nAnalysis: Alignment, contradictions, shifts, retractions.\nLLM Task: Compare statements, highlight reversals.`,
  authenticity: `Goal: Evaluate depth and originality.\nAnalysis: Original content, storytelling, engagement.\nLLM Task: Identify narratives, flag recycled content.`,
  socialRiskProfile: `Goal: Evaluate reputational risk.\nAnalysis: Problematic content, hate speech, extremism, backlash.\nLLM Task: Score toxicity, flag posts.`,
  onlineExposure: `Goal: Quantify public visibility.\nAnalysis: Mentions, media, podcasts, Reddit, YouTube, Google.\nLLM Task: Count mentions, appearances.`,
  positiveMarkers: `Goal: Surface positive achievements.\nAnalysis: Awards, verification, publications, leadership, charity.\nLLM Task: Extract accomplishments with sources.`
};

// Sentiment Analysis (Third-party Mentions)
export const sentimentAnalysisExample = `Positive coverage in multiple TechCrunch articles. One Reddit thread questioning transparency around recent fundraising (linked). No major controversies identified.`;

// Consistency
export const consistencyExample = `Previously advocated remote-first work model, reversed position in recent interviews. Issued public apology in 2022 regarding insensitive comment.`;

// Authenticity
export const authenticityExample = `Shares personal career journey in multiple interviews. Willing to discuss personal failures. High engagement on community-focused threads.`;

// Social Risk Profile (Cancelability)
export const socialRiskProfileExample = `One post from 2018 flagged for offensive racial slur (linked). No pattern of recurring problematic behavior detected.`;

// Online Exposure Level
export const onlineExposureExample = `Featured in 4 major tech press articles, appeared on 2 podcasts, mentioned in multiple Reddit threads, and ranks on Google first page.`;

// Positive Reputation Markers
export const positiveMarkersExample = `Selected for Forbes 30 Under 30 (2023). Board member at local nonprofit. Verified LinkedIn and Twitter accounts.`;
