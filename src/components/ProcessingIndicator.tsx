import React, { useState, useEffect } from 'react';
import { FaSearch, FaDatabase, FaChartBar, FaRobot, FaCheckCircle, FaCircleNotch, FaClock } from 'react-icons/fa';

interface ProcessingIndicatorProps {
  name: string;
}

export default function ProcessingIndicator({ name }: ProcessingIndicatorProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // List of steps in the analysis process with icons
  const steps = [
    { text: "Retrieving data from social platforms", icon: <FaDatabase /> },
    { text: "Analyzing professional presence", icon: <FaSearch /> },
    { text: "Evaluating tone and sentiment", icon: <FaChartBar /> },
    { text: "Assessing reputation markers", icon: <FaRobot /> },
    { text: "Generating comprehensive analysis", icon: <FaCheckCircle /> }
  ];

  // Automatically advance steps for the animation
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : 0));
    }, 4000); // Slower step progression
    
    // Track elapsed time
    const timeInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    
    return () => {
      clearInterval(stepInterval);
      clearInterval(timeInterval);
    };
  }, [steps.length]);

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
    <div className="glass-panel p-8 sm:p-10 md:p-12 max-w-2xl mx-auto text-center">
      <div className="space-y-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Analyzing <span className="bg-gradient-to-r from-violet-400 to-purple-600 bg-clip-text text-transparent">{name}</span>
          </h2>
          <p className="text-gray-400 mt-3 text-lg">
            {getTimeMessage(elapsedTime)}
          </p>
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <FaClock />
          <span>Elapsed: {formatTime(elapsedTime)}</span>
        </div>

        {/* Progress Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-500 ${
                index === activeStep
                  ? 'bg-violet-600/20 border border-violet-500/30'
                  : index < activeStep
                  ? 'bg-green-600/10 border border-green-500/20'
                  : 'bg-gray-800/30 border border-gray-700/30'
              }`}
            >
              <div className={`text-xl ${
                index === activeStep
                  ? 'text-violet-400 animate-pulse'
                  : index < activeStep
                  ? 'text-green-400'
                  : 'text-gray-500'
              }`}>
                {index === activeStep ? <FaCircleNotch className="animate-spin" /> : step.icon}
              </div>
              <span className={`${
                index === activeStep
                  ? 'text-violet-300 font-medium'
                  : index < activeStep
                  ? 'text-green-300'
                  : 'text-gray-400'
              }`}>
                {step.text}
              </span>
              {index < activeStep && (
                <div className="ml-auto text-green-400">
                  <FaCheckCircle />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Information */}
        <div className="text-sm text-gray-500 bg-gray-800/50 p-4 rounded-lg">
          <p className="mb-2">
            <strong>What we're analyzing:</strong>
          </p>
          <ul className="text-left space-y-1 text-xs">
            <li>• Professional presence and consistency</li>
            <li>• Communication tone and language patterns</li>
            <li>• Public sentiment and third-party mentions</li>
            <li>• Social risk factors and reputation markers</li>
            <li>• Online exposure and visibility metrics</li>
          </ul>
        </div>
        
        {elapsedTime > 300 && (
          <div className="text-amber-400 text-sm bg-amber-900/20 p-3 rounded-lg border border-amber-800/30">
            <p>Taking longer than usual? This can happen when:</p>
            <ul className="text-xs mt-2 space-y-1 text-left">
              <li>• Processing large amounts of content</li>
              <li>• API rate limiting on external services</li>
              <li>• Complex analysis requiring multiple AI calls</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
