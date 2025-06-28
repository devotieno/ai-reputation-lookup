/**
 * API utility functions for interacting with the backend API routes
 */

import { UserInput } from "@/app/page";

/**
 * Submit user input form data including photo
 */
export async function submitUserInput(data: UserInput, userId?: string): Promise<{ userId: string }> {
  const formData = new FormData();
  formData.append("name", data.name);
  if (data.twitter) formData.append("twitter", data.twitter);
  if (data.linkedin) formData.append("linkedin", data.linkedin);
  if (data.reddit) formData.append("reddit", data.reddit);
  if (data.youtube) formData.append("youtube", data.youtube);
  if (data.instagram) formData.append("instagram", data.instagram);
  if (data.github) formData.append("github", data.github);
  if (data.email) formData.append("email", data.email);
  if (data.photo) formData.append("photo", data.photo);
  if (userId) formData.append("userId", userId);

  const res = await fetch("/api/submitUserInput", {
    method: "POST",
    body: formData,
    cache: 'no-store'
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to submit user input: ${error}`);
  }

  return res.json();
}

/**
 * Queue analysis job for a specific category
 */
export async function queueJob(userId: string, category: string, query: string): Promise<{ success: boolean, jobId: string }> {
  const res = await fetch("/api/queueJob", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, category, query }),
    cache: 'no-store'
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to queue job: ${error}`);
  }

  return res.json();
}

/**
 * Get analysis results for a user
 */
export async function getAnalysisResults(userId: string): Promise<{ results: Record<string, unknown> }> {
  const res = await fetch(`/api/getAnalysisResults?userId=${userId}`, {
    method: 'GET',
    cache: 'no-store'
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch results: ${error}`);
  }

  return res.json();
}

/**
 * Retrieve data from various sources
 */
export async function retrieveData(userId: string, query: string): Promise<{ results: unknown[] }> {
  const res = await fetch("/api/retrieveData", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, query }),
    cache: 'no-store'
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to retrieve data: ${error}`);
  }

  return res.json();
}

/**
 * Analyze data for a specific category
 */
export async function analyzeData(userId: string, category: string, items: unknown[]): Promise<{ analysis: unknown }> {
  const res = await fetch("/api/analyzeData", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, category, items }),
    cache: 'no-store'
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to analyze data: ${error}`);
  }

  return res.json();
}

/**
 * Process pending jobs (admin function)
 */
export async function processJobs(): Promise<{ processedCount: number, errorCount: number, totalJobs: number }> {
  const res = await fetch("/api/processJobs", {
    method: "GET",
    cache: 'no-store'
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to process jobs: ${error}`);
  }

  return res.json();
}
