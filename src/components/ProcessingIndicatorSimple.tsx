import React, { useState, useEffect } from 'react';
import { FaCircleNotch, FaClock } from 'react-icons/fa';

interface ProcessingIndicatorProps {
  name: string;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ name }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Track elapsed time
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    
    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeMessage = (seconds: number) => {
    if (seconds < 60) return "Analysis starting...";
    if (seconds < 180) return "Processing data from multiple sources...";
    if (seconds < 300) return "Performing detailed AI analysis...";
    if (seconds < 480) return "Finalizing comprehensive report...";
    return "Complex analysis in progress - this may take a few more minutes...";
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="glass-panel p-8 text-center">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">
            Analyzing {name}&apos;s Reputation
          </h2>
          <p className="text-gray-400">
            Please wait while we gather and analyze data from multiple sources
          </p>
        </div>

        {/* Loading Animation */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <FaCircleNotch className="text-6xl text-violet-400 animate-spin" />
          </div>
          <p className="text-violet-300 font-medium">
            {getTimeMessage(elapsedTime)}
          </p>
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center text-sm text-gray-500 mb-6">
          <FaClock className="mr-2" />
          <span>Elapsed time: {formatTime(elapsedTime)}</span>
        </div>

        {/* Progress Explanation */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 text-left">
          <h4 className="font-semibold text-gray-300 mb-3">What&apos;s happening:</h4>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• Retrieving data from social platforms and search engines</li>
            <li>• Analyzing content for professionalism and sentiment</li>
            <li>• Evaluating tone, consistency, and authenticity</li>
            <li>• Assessing risk factors and positive reputation markers</li>
            <li>• Generating comprehensive analysis with AI models</li>
          </ul>
        </div>

        {/* Extended Time Notice */}
        {elapsedTime > 300 && (
          <div className="mt-6 bg-amber-900/20 border border-amber-800/30 rounded-lg p-4">
            <p className="text-amber-300 text-sm">
              <strong>Analysis taking longer than expected:</strong>
            </p>
            <ul className="text-amber-200 text-xs mt-2 space-y-1">
              <li>• Large amount of data being processed</li>
              <li>• Multiple AI models working in parallel</li>
              <li>• Complex analysis requiring multiple API calls</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingIndicator;
