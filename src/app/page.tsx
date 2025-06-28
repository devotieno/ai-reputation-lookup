"use client";

import UserInputForm from "../components/UserInputForm";
import OAuthConnect from "../components/OAuthConnect";
import ProcessingIndicator from "../components/ProcessingIndicatorSimple";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { FaReddit, FaTwitter, FaYoutube, FaLinkedin, FaSearch, FaRobot, FaShieldAlt, FaInfoCircle, FaDownload, FaChartBar, FaCheck, FaUser, FaComments, FaHeart, FaBalanceScale, FaUserCheck, FaExclamationTriangle, FaGlobe, FaStar } from "react-icons/fa";
import { MdDangerous } from "react-icons/md";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useSession } from "next-auth/react";
import type { JSX } from "react";
import * as apiClient from "@/utils/api";

export type UserInput = {
  name: string;
  twitter?: string;
  linkedin?: string;
  reddit?: string;
  youtube?: string;
  instagram?: string;
  github?: string;
  email?: string;
  photo?: File | null;
};

const CATEGORY_ICONS: Record<string, JSX.Element> = {
  professionalism: <FaUser className="text-blue-400" />,
  toneAndLanguage: <FaComments className="text-green-400" />,
  sentiment: <FaHeart className="text-pink-400" />,
  consistency: <FaBalanceScale className="text-purple-400" />,
  authenticity: <FaUserCheck className="text-teal-400" />,
  socialRiskProfile: <FaExclamationTriangle className="text-red-400" />,
  onlineExposure: <FaGlobe className="text-orange-400" />,
  positiveMarkers: <FaStar className="text-yellow-400" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  professionalism: "Professionalism",
  toneAndLanguage: "Tone & Language", 
  sentiment: "Sentiment Analysis",
  consistency: "Consistency",
  authenticity: "Authenticity",
  socialRiskProfile: "Social Risk Profile",
  onlineExposure: "Online Exposure Level",
  positiveMarkers: "Positive Reputation Markers",
};

const CATEGORIES = Object.keys(CATEGORY_ICONS);

export default function HomePage() {
  const { data: session } = useSession();
  const [analysisResults, setAnalysisResults] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'results'>('form');
  const [userName, setUserName] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isPolling, setIsPolling] = useState(false);
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize analysis results processing - simplified for performance
  const processedResults = useMemo(() => {
    if (!analysisResults || Object.keys(analysisResults).length === 0) return null;
    return analysisResults; // Return as-is, process in render if needed
  }, [analysisResults]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  // Optimized polling function with better performance and error handling
  const pollForResults = useCallback(async (userId: string) => {
    if (isPolling) return; // Prevent multiple polling instances
    
    setIsPolling(true);
    let attempts = 0;
    const maxAttempts = 120; // Poll for up to 16 minutes (120 × 8s)
    const pollInterval = 8000; // 8 seconds between polls

    const poll = async () => {
      attempts++;
      console.log(`Polling attempt ${attempts}/${maxAttempts} for userId: ${userId}`);
      
      try {
        // Use AbortController for request timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const { results } = await apiClient.getAnalysisResults(userId);
        clearTimeout(timeoutId);
        
        console.log("Polling results:", results);

        // Check if we have analysis results for any of the 8 categories
        const hasResults = results && 
          Object.keys(results).length > 0 && 
          Object.keys(results).some(categoryName => {
            const categoryData = results[categoryName] as { 
              summary?: string; 
              flagged?: unknown[]; 
              platforms?: string[]; 
            };
            return categoryData && (
              (categoryData.summary && categoryData.summary !== "No data available for analysis.") ||
              (categoryData.flagged && categoryData.flagged.length > 0)
            );
          });

        if (hasResults) {
          console.log("Analysis complete, setting results");
          setAnalysisResults(results);
          setLoading(false);
          setStep('results');
          setIsPolling(false);
          return; // Exit polling
        } 
        
        // Trigger job processing every 10 attempts (80 seconds) to ensure jobs are being processed
        if (attempts % 10 === 0) {
          console.log(`Triggering job processing at attempt ${attempts}`);
          try {
            await fetch("/api/processJobs", {
              method: "GET",
              cache: 'no-store'
            });
            console.log("Job processing triggered successfully");
          } catch (error) {
            console.warn("Failed to trigger job processing:", error);
          }
        }
        
        // Check for stuck jobs every 20 attempts (160 seconds)
        if (attempts % 20 === 0) {
          console.log(`Checking for stuck jobs at attempt ${attempts}`);
          try {
            await fetch("/api/checkStuckJobs", {
              method: "GET",
              cache: 'no-store'
            });
            console.log("Stuck job check completed");
          } catch (error) {
            console.warn("Failed to check stuck jobs:", error);
          }
        }
        
        if (attempts < maxAttempts) {
          console.log(`No results yet, will retry in ${pollInterval/1000} seconds`);
          pollTimeoutRef.current = setTimeout(poll, pollInterval);
        } else {
          console.log("Analysis timed out after maximum attempts");
          setLoading(false);
          setStep('form');
          setIsPolling(false);
          setSubmitDisabled(false);
          alert("Analysis is taking longer than expected. This may indicate an issue with data retrieval or processing. Please try again later or contact support if the issue persists.");
        }
      } catch (error) {
        console.error("Error polling for results:", error);
        if (attempts < maxAttempts) {
          console.log(`Error occurred, retrying in ${pollInterval/1000} seconds`);
          pollTimeoutRef.current = setTimeout(poll, pollInterval);
        } else {
          setLoading(false);
          setStep('form');
          setIsPolling(false);
          setSubmitDisabled(false);
          alert("Error retrieving analysis results. Please check your connection and try again.");
        }
      }
    };

    // Start polling immediately
    poll();
  }, [isPolling]);



  // Optimized form submission with debouncing and better error handling
  const handleUserInput = useCallback(async (data: UserInput) => {
    if (loading || submitDisabled) return; // Prevent double submission
    
    setSubmitDisabled(true);
    setLoading(true);
    setAnalysisResults({});
    setStep('processing');
    setUserName(data.name);

    try {
      // Submit user input using the centralized API client
      const { userId } = await apiClient.submitUserInput(data, session?.user?.id);
      setCurrentUserId(userId);

      // Jobs are now automatically queued by submitUserInput API based on provided platform handles
      console.log(`User input submitted with ID: ${userId}. Jobs queued for provided platforms only.`);

      // Start polling for results
      pollForResults(userId);

    } catch (error) {
      console.error("Error handling user input:", error);
      setLoading(false);
      setStep('form');
      setSubmitDisabled(false);
      alert("Error submitting analysis request. Please try again.");
    }
  }, [loading, submitDisabled, session?.user?.id, pollForResults]);

  // Optimized PDF download with error handling
  const handleDownloadPDF = useCallback(async () => {
    if (!reportRef.current || loading) return;

    try {
      setLoading(true);
      
      // Use html2canvas to capture the report as an image
      const canvas = await html2canvas(reportRef.current, {
        scale: 1, // Reduce scale for better performance
        useCORS: true,
        allowTaint: true
      });
      const imgData = canvas.toDataURL('image/png');

      // Create a PDF from the image
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pageWidth;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${userName || 'user'}-reputation-report.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [loading, userName]);

  // Optimized reset function
  const resetToForm = useCallback(() => {
    // Clear polling timeout
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    
    setIsPolling(false);
    setLoading(false);
    setStep('form');
    setSubmitDisabled(false);
    setAnalysisResults({});
    setUserName("");
    setCurrentUserId("");
  }, []);

  return (
    <main className="min-h-[calc(100vh-8rem)]">
      {/* STEP 1: Form */}
      {step === 'form' && (
        <div 
          key="form-step"
          className="max-w-5xl mx-auto py-6"
        >
            {/* Hero Section */}
            <div className="mb-12">
              <div
                className="glass-panel p-8 mb-8 overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
                
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-600">
                  AI Reputation Lookup
                </h1>
                <p className="text-xl text-gray-300 mb-6 max-w-3xl">
                  Comprehensive AI-powered reputation analysis with two access modes: Public analysis using social media handles/URLs, or deeper connected analysis when you sign in and link your accounts.
                </p>
                
                <div className="flex flex-wrap gap-3 mb-8">
                  {[
                    { name: "Public Analysis", icon: <FaGlobe /> },
                    { name: "Connected Analysis", icon: <FaShieldAlt /> },
                    { name: "AI-Powered Insights", icon: <FaRobot /> },
                    { name: "Multi-Platform Data", icon: <FaChartBar /> },
                  ].map((tag) => (
                    <span key={tag.name} className="px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-full text-sm text-gray-300 flex items-center">
                      <span className="mr-1.5">{tag.icon}</span>
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Form Section */}
            <UserInputForm 
              onSubmit={handleUserInput} 
              disabled={submitDisabled} 
              isAuthenticated={!!session}
              connectedAccounts={[]} // TODO: Get actual connected accounts from session
            />
            
            {/* OAuth Connect Section or Sign-in Prompt */}
            {session ? (
              <div className="mt-12">
                <OAuthConnect />
              </div>
            ) : (
              <div className="mt-12">
                <div className="glass-panel p-6 text-center">
                  <h3 className="text-xl font-semibold mb-3 text-purple-300">Want Deeper Analysis?</h3>
                  <p className="text-gray-300 mb-4">
                    Sign in and connect your social media accounts for comprehensive analysis with full content access, 
                    bypassing scraping limitations and providing more detailed insights.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <FaShieldAlt className="text-purple-400 mr-2" />
                      <span>Deeper content analysis</span>
                    </div>
                    <div className="flex items-center">
                      <FaUserCheck className="text-green-400 mr-2" />
                      <span>No scraping limitations</span>
                    </div>
                    <div className="flex items-center">
                      <FaChartBar className="text-blue-400 mr-2" />
                      <span>Enhanced insights</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}
      
      {/* STEP 2: Processing */}
      {step === 'processing' && (
        <div 
          key="processing-step"
          className="py-10"
        >
            <ProcessingIndicator name={userName} />
        </div>
      )}
      
      {/* STEP 3: Results */}
      {step === 'results' && (
        <div 
          key="results-step"
          className="max-w-5xl mx-auto py-8"
        >
            <div className="glass-panel p-6 mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Reputation Analysis</h2>
                <div className="flex items-center space-x-4">
                  <p className="text-gray-400">{userName || "User"}</p>
                  <div className="flex items-center text-sm">
                    {session ? (
                      <>
                        <FaShieldAlt className="text-purple-400 mr-1" />
                        <span className="text-purple-300">Connected Analysis</span>
                      </>
                    ) : (
                      <>
                        <FaGlobe className="text-green-400 mr-1" />
                        <span className="text-green-300">Public Analysis</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg"
              >
                <FaDownload className="mr-2" />
                Download Report
              </button>
            </div>
            
            <div className="mb-8">
              <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold mb-4">Summary</h3>
                <div className="space-y-3">
                  {Object.keys(analysisResults).length === 0 ? (
                    <p className="text-gray-400 italic">No analysis results available yet.</p>
                  ) : (
                    // Show a consolidated overview summary
                    <div className="text-gray-300">
                      <p className="mb-3">
                        {session 
                          ? "Connected analysis completed with deeper access to account data across multiple platforms and sources."
                          : "Public analysis completed using publicly available data across multiple platforms and sources."
                        }
                      </p>
                      {Object.keys(analysisResults).length > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">
                            Analysis covers {Object.keys(analysisResults).length} key areas of reputation assessment.
                          </span>
                          {!session && (
                            <span className="text-blue-400 text-xs bg-blue-900/20 px-2 py-1 rounded">
                              Sign in for deeper analysis
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div ref={reportRef} className="space-y-6">
              {Object.entries(analysisResults).map(([categoryName, categoryData]: [string, any]) => (
                <section 
                  key={categoryName}
                  className="glass-panel p-6"
                >
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <span className="mr-2 text-2xl">{CATEGORY_ICONS[categoryName] || <FaInfoCircle className="text-blue-400" />}</span>
                    {CATEGORY_LABELS[categoryName] || categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
                  </h3>
                  
                  <div className="mb-4 text-gray-300">
                    {categoryData?.summary || "No analysis available for this category."}
                  </div>
                  
                  {/* Show platforms analyzed for this category */}
                  {categoryData?.platforms && categoryData.platforms.length > 0 && (
                    <div className="mb-4 text-sm text-gray-500">
                      <span className="font-medium">Sources analyzed:</span> {categoryData.platforms.join(', ')}
                    </div>
                  )}
                  
                  {Array.isArray(categoryData?.flagged) && categoryData.flagged.length > 0 && (
                    <details className="mt-4 mb-6">
                      <summary className="cursor-pointer text-amber-400 font-medium flex items-center">
                        <MdDangerous className="inline mr-2" />
                        {categoryData.flagged.length} Flagged Items
                      </summary>
                      <ul className="mt-2 space-y-4 pl-4 border-l-2 border-amber-900/50">
                        {categoryData.flagged.map((item: unknown, i: number) => {
                          const flaggedItem = item as { 
                            reason?: string; 
                            content?: string; 
                            platform?: string; 
                            date?: string; 
                            url?: string; 
                            severity?: string;
                          };
                          return (
                          <li key={i} className="bg-amber-900/10 border border-amber-800/30 p-4 rounded-lg">
                            <div className="font-medium text-amber-300 mb-2">{flaggedItem.reason || "Flagged content"}</div>
                            <blockquote className="text-gray-300 italic mb-3 pl-3 border-l-2 border-gray-600">
                              &ldquo;{flaggedItem.content || String(item)}&rdquo;
                            </blockquote>
                            <div className="text-xs text-gray-400 space-y-1">
                              {flaggedItem.platform && (
                                <div><span className="font-medium">Platform:</span> {flaggedItem.platform}</div>
                              )}
                              {flaggedItem.date && (
                                <div><span className="font-medium">Date:</span> {new Date(flaggedItem.date).toLocaleDateString()}</div>
                              )}
                              {flaggedItem.url && (
                                <div>
                                  <span className="font-medium">Source:</span>{" "}
                                  <a 
                                    href={flaggedItem.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-400 hover:underline break-all"
                                  >
                                    {flaggedItem.url}
                                  </a>
                                </div>
                              )}
                              {flaggedItem.severity && (
                                <div>
                                  <span className="font-medium">Severity:</span>{" "}
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    flaggedItem.severity === 'high' ? 'bg-red-900/50 text-red-300' :
                                    flaggedItem.severity === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                                    'bg-green-900/50 text-green-300'
                                  }`}>
                                    {flaggedItem.severity.toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </li>
                          );
                        })}
                      </ul>
                    </details>
                  )}
                </section>
              ))}
            </div>
          </div>
        )}
    </main>
  );
}
