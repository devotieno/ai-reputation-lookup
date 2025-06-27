"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { 
  FiChevronDown, 
  FiChevronUp, 
  FiFlag, 
  FiExternalLink, 
  FiArrowLeft 
} from "react-icons/fi";

// Interfaces for report data structure
interface FlaggedItem {
  content: string;
  reason: string;
  severity: "low" | "medium" | "high";
  url: string;
  date?: string;
}

interface CategoryDetail {
  name: string;
  summary: string;
  flaggedContent: FlaggedItem[];
}

interface Quote {
  content: string;
  url: string;
  date: string;
}

interface Report {
  id: string;
  name: string;
  createdAt: string;
  summaries: string[];
  toxicityScore: number;
  quotes: Quote[];
  categories: CategoryDetail[];
}

export default function ReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    const fetchReport = async () => {
      try {
        if (!id) {
          throw new Error("Report ID not provided");
        }
        
        // Try to get the report from both collections
        console.log(`Attempting to fetch report with ID: ${id}`);
        
        // First try "reports" collection
        let reportRef = doc(db, "reports", id as string);
        let reportSnapshot = await getDoc(reportRef);
        
        // If not found in reports, try analysisResults
        if (!reportSnapshot.exists()) {
          console.log("Report not found in 'reports' collection, checking 'analysisResults'");
          
          // For analysisResults, we need to find by jobId rather than document ID
          const q = query(collection(db, "analysisResults"), where("jobId", "==", id));
          const resultsSnapshot = await getDocs(q);
          
          if (resultsSnapshot.empty) {
            console.log("No matching analysis results found with jobId:", id);
            
            // As a last resort, try to match by exact document ID
            reportRef = doc(db, "analysisResults", id as string);
            reportSnapshot = await getDoc(reportRef);
            
            if (!reportSnapshot.exists()) {
              console.log("No results found by document ID either");
              throw new Error("Report not found");
            }
          } else {
            // Use the first matching result
            console.log(`Found ${resultsSnapshot.size} analysis results`);
            reportSnapshot = resultsSnapshot.docs[0];
          }
        }
        
        const data = reportSnapshot.data();
        console.log("Found report data:", data);
        
        if (!data) {
          throw new Error("Report data is undefined");
        }
        
        // Transform the data to match the Report interface
        const rawData = data;
        const analysisData = rawData.analysis || rawData;
        
        // Create a properly formatted report object
        const reportData: Report = {
          id: reportSnapshot.id,
          name: rawData.name || "Unknown",
          createdAt: rawData.createdAt || new Date().toISOString(),
          summaries: analysisData.summaries || [],
          toxicityScore: analysisData.toxicityScore || 0,
          quotes: analysisData.quotes || [],
          categories: []
        };
        
        // Transform categories from object to array format
        if (analysisData.categories) {
          reportData.categories = Object.entries(analysisData.categories).map(([key, value]: [string, any]) => ({
            name: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize category name
            summary: typeof value.summary === 'string' ? value.summary : "No summary available",
            flaggedContent: Array.isArray(value.flagged) ? value.flagged.map((item: any) => ({
              content: typeof item === 'string' ? item : (item?.content || "Flagged content"),
              reason: item?.reason || "Content flagged for review",
              severity: (item?.severity === "low" || item?.severity === "medium" || item?.severity === "high") 
                ? item.severity 
                : "medium" as const,
              url: item?.url || "",
              date: item?.date || undefined
            })) : []
          }));
        }
        
        console.log("Transformed report data:", reportData);
        setReport(reportData);
      } catch (err) {
        console.error("Error fetching report:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [id]);
  
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Loading report...</p>
        </div>
      </div>
    );
  }
  
  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Error</h2>
          <p className="mt-2 text-red-600">{error || "Failed to load report"}</p>
          <div className="mt-6">
            <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center">
              <FiArrowLeft className="mr-2" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Link href="/" className="mr-4 text-blue-600 hover:text-blue-800">
              <FiArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">AI Reputation Report</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Generated on {new Date(report.createdAt).toLocaleDateString()} for {report.name}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Overall Summary Section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Overall Summary</h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Comprehensive analysis of online presence and reputation
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              {report.summaries && report.summaries.map((summary, index) => (
                <p key={index} className="text-gray-700 mb-3">
                  {summary}
                </p>
              ))}
              
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700">Reputation Risk Level</h3>
                <div className="mt-2 flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        report.toxicityScore < 0.3 
                          ? 'bg-green-500' 
                          : report.toxicityScore < 0.6 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`} 
                      style={{ width: `${report.toxicityScore * 100}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {Math.round(report.toxicityScore * 100)}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {report.toxicityScore < 0.3 
                    ? 'Low risk - Content appears generally safe and appropriate' 
                    : report.toxicityScore < 0.6 
                      ? 'Moderate risk - Some content may be problematic' 
                      : 'High risk - Significant problematic content detected'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Category Reports */}
          <div className="space-y-6">
            {report.categories && report.categories.map((category) => (
              <div key={category.name} className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div 
                  className="px-4 py-5 sm:px-6 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleCategory(category.name)}
                >
                  <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                  {expandedCategories[category.name] ? <FiChevronUp /> : <FiChevronDown />}
                </div>
                
                {expandedCategories[category.name] && (
                  <div className="border-t border-gray-200">
                    <div className="px-4 py-5 sm:px-6">
                      <p className="text-gray-700">{category.summary}</p>
                      
                      {category.flaggedContent && category.flaggedContent.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-4">Notable Content</h4>
                          <div className="space-y-4">
                            {category.flaggedContent.map((item, idx) => (
                              <div key={idx} className="border rounded-md p-4 bg-gray-50">
                                <div className="flex items-start">
                                  <FiFlag className={`mr-2 mt-1 ${
                                    item.severity === 'high' ? 'text-red-500' : 
                                    item.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                                  }`} />
                                  <div>
                                    <p className="text-gray-800">{item.content}</p>
                                    <div className="mt-2 text-sm text-gray-500 flex justify-between items-center">
                                      <span>{item.reason}</span>
                                      {item.date && <span>{new Date(item.date).toLocaleDateString()}</span>}
                                    </div>
                                    {item.url && (
                                      <a 
                                        href={item.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                      >
                                        Source <FiExternalLink className="ml-1" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Direct Quotes Section */}
          {report.quotes && report.quotes.length > 0 && (
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Source Quotes</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Direct quotes from across platforms
                </p>
              </div>
              <div className="border-t border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {report.quotes.slice(0, 10).map((quote, idx) => (
                    <li key={idx} className="px-4 py-4 sm:px-6">
                      <p className="text-gray-800">&ldquo;{quote.content}&rdquo;</p>
                      <div className="mt-2 flex justify-between text-sm text-gray-500">
                        <span>{new Date(quote.date).toLocaleDateString()}</span>
                        {quote.url && (
                          <a 
                            href={quote.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            Source <FiExternalLink className="ml-1" />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <div className="mt-8 flex flex-col sm:flex-row sm:justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              New Lookup
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Print Report
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
