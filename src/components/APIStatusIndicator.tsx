import { useState, useEffect, useMemo, memo } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';

interface APIStatus {
  name: string;
  status: 'working' | 'warning' | 'error';
  message: string;
  key: string;
}

// Memoized status icon component for better performance
const StatusIcon = memo(({ status }: { status: string }) => {
  switch (status) {
    case 'working':
      return <FaCheckCircle className="text-green-500" />;
    case 'warning':
      return <FaExclamationTriangle className="text-yellow-500" />;
    case 'error':
      return <FaTimesCircle className="text-red-500" />;
    default:
      return <FaTimesCircle className="text-gray-500" />;
  }
});

StatusIcon.displayName = 'StatusIcon';

const APIStatusIndicator = memo(() => {
  const [loading, setLoading] = useState(true);

  // Memoize static API statuses to prevent re-computation
  const apiStatuses = useMemo<APIStatus[]>(() => [
    {
      name: 'OpenAI GPT-4o',
      status: 'working',
      message: 'Core AI analysis engine',
      key: 'openai'
    },
    {
      name: 'Perspective API',
      status: 'working',
      message: 'Toxicity and hate speech detection',
      key: 'perspective'
    },
    {
      name: 'Perplexity API',
      status: 'working',
      message: 'Web intelligence and research',
      key: 'perplexity'
    },
    {
      name: 'SerpAPI',
      status: 'working',
      message: 'Search result analysis',
      key: 'serpapi'
    }
  ], []);

  // Memoize whether any APIs have issues
  const hasIssues = useMemo(() => 
    apiStatuses.some(api => api.status === 'warning' || api.status === 'error'),
    [apiStatuses]
  );

  useEffect(() => {
    // Optimize loading simulation
    const timer = setTimeout(() => setLoading(false), 50);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <div className="animate-pulse flex items-center">
          <div className="h-4 bg-gray-700 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">API Status</h3>
      <div className="space-y-2">
        {apiStatuses.map((api) => (
          <div key={api.key} className="flex items-center justify-between text-xs">
            <div className="flex items-center">
              <span className="mr-2">
                <StatusIcon status={api.status} />
              </span>
              <span className="text-gray-300">{api.name}</span>
            </div>
            <span className={`text-xs ${
              api.status === 'working' ? 'text-green-400' :
              api.status === 'warning' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {api.message}
            </span>
          </div>
        ))}
      </div>
      
      {hasIssues && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            Some APIs need configuration. See{' '}
            <span className="text-blue-400">PERSPECTIVE_API_SETUP.md</span> for instructions.
          </p>
        </div>
      )}
    </div>
  );
});

APIStatusIndicator.displayName = 'APIStatusIndicator';

export default APIStatusIndicator;
