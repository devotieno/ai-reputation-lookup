const demoEvidence = {
  github: {
    quote: "Open-sourced three projects with an active history of community contributions.",
    platform: "GitHub",
    author: "Public profile",
    date: "Recent activity",
    url: "https://github.com",
  },
  linkedin: {
    quote: "Shared practical leadership and product-development insights with a professional audience.",
    platform: "LinkedIn",
    author: "Public profile",
    date: "Recent activity",
    url: "https://www.linkedin.com",
  },
  reddit: {
    quote: "A few older discussions use a more abrupt tone than Alex's recent posts.",
    platform: "Reddit",
    author: "Public discussion",
    date: "Older activity",
    url: "https://www.reddit.com",
  },
};

export const DEMO_RESULTS = {
  professionalism: {
    score: 88,
    narrative: "Alex Jordan maintains a consistently professional online presence. Public profiles emphasize product leadership, thoughtful collaboration, and clear communication.",
    summary: "Strong professional signals across LinkedIn and GitHub.",
    platforms: ["linkedin", "github"],
    evidenceWithSources: [demoEvidence.github, demoEvidence.linkedin],
    flaggedContent: [],
  },
  toneAndLanguage: {
    score: 76,
    narrative: "Most public writing is constructive and measured. A small number of older comments are more direct, while recent contributions show a more considerate and explanatory style.",
    summary: "Generally constructive tone, with a few older blunt exchanges.",
    platforms: ["linkedin", "reddit", "github"],
    evidenceWithSources: [demoEvidence.linkedin],
    flaggedContent: [
      {
        reason: "Older comment with unusually blunt wording",
        content: "That approach is going to cause problems; I would revisit the assumptions before shipping it.",
        severity: "low",
        platform: "Reddit",
        date: "Older activity",
        url: "https://www.reddit.com",
      },
    ],
  },
  sentiment: {
    score: 82,
    narrative: "The overall tone of available public contributions is positive and solution-oriented. Alex often acknowledges other contributors and focuses on practical next steps.",
    summary: "Positive sentiment with a collaborative outlook.",
    platforms: ["linkedin", "github"],
    evidenceWithSources: [demoEvidence.github],
    flaggedContent: [],
  },
  consistency: {
    score: 91,
    narrative: "The professional background and interests described across public profiles are highly consistent. No notable conflicts between the sampled sources were found.",
    summary: "Consistent professional identity across public profiles.",
    platforms: ["linkedin", "github"],
    evidenceWithSources: [demoEvidence.linkedin, demoEvidence.github],
    flaggedContent: [],
  },
  authenticity: {
    score: 79,
    narrative: "The sampled profiles show a credible mix of original contributions and ongoing activity. The available public information is limited, so this score should be treated as an indicator rather than verification.",
    summary: "Credible activity signals; limited public data available.",
    platforms: ["linkedin", "github"],
    evidenceWithSources: [demoEvidence.github],
    flaggedContent: [],
  },
  socialRiskProfile: {
    score: 93,
    narrative: "No significant high-risk patterns were found in the illustrative sample. A few older, direct exchanges are low severity and appear isolated.",
    summary: "Low apparent social risk in the sampled public content.",
    platforms: ["reddit", "linkedin", "github"],
    evidenceWithSources: [demoEvidence.reddit],
    flaggedContent: [
      {
        reason: "Isolated older disagreement",
        content: "I don't think that proposal is workable in its current form.",
        severity: "low",
        platform: "Reddit",
        date: "Older activity",
        url: "https://www.reddit.com",
      },
    ],
  },
  onlineExposure: {
    score: 65,
    narrative: "Alex has a moderate public footprint concentrated around professional and developer communities. This offers useful visibility while keeping personal exposure relatively limited.",
    summary: "Moderate, mostly professional online visibility.",
    platforms: ["linkedin", "github", "reddit"],
    evidenceWithSources: [demoEvidence.linkedin],
    flaggedContent: [],
  },
  positiveMarkers: {
    score: 85,
    narrative: "Positive signals include open-source contributions, knowledge sharing, and constructive participation in professional discussions. The sample suggests a dependable and community-minded presence.",
    summary: "Strong contribution and knowledge-sharing signals.",
    platforms: ["github", "linkedin"],
    evidenceWithSources: [demoEvidence.github, demoEvidence.linkedin],
    flaggedContent: [],
  },
} satisfies Record<string, {
  score: number;
  narrative: string;
  summary: string;
  platforms: string[];
  evidenceWithSources: Array<{
    quote: string;
    platform: string;
    author: string;
    date: string;
    url: string;
  }>;
  flaggedContent: Array<{
    reason: string;
    content: string;
    severity: string;
    platform: string;
    date: string;
    url: string;
  }>;
}>;
