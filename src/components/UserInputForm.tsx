import React, { useState, useCallback, memo } from "react";
import { FaUser, FaTwitter, FaLinkedin, FaReddit, FaYoutube, FaInstagram, FaGithub, FaEnvelope, FaImage, FaArrowRight, FaInfoCircle, FaLock, FaGlobe, FaSearch } from "react-icons/fa";

type UserInput = {
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

const UserInputForm: React.FC<{ 
  onSubmit: (data: UserInput) => void;
  disabled?: boolean;
  isAuthenticated?: boolean;
  connectedAccounts?: string[];
}> = memo(({ onSubmit, disabled = false, isAuthenticated = false, connectedAccounts = [] }) => {
  const [form, setForm] = useState<UserInput>({ name: "", photo: null });
  const [fileName, setFileName] = useState<string>("");

  // Optimized change handler with useCallback
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === "photo" && files && files.length > 0) {
      console.log("File selected in form:", files[0].name, files[0].size);
      setForm((prev) => ({ ...prev, photo: files[0] }));
      setFileName(files[0].name);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  // Optimized submit handler with useCallback
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return; // Prevent submission when disabled
    console.log("Form submission with photo:", form.photo?.name, form.photo?.size);
    onSubmit(form);
  }, [disabled, form, onSubmit]);

  return (
    <form 
      onSubmit={handleSubmit} 
      className="glass-panel p-6 space-y-6 max-w-2xl mx-auto"
    >
      <h2 className="text-2xl font-bold mb-6 text-center gradient-text">AI Reputation Lookup</h2>
      
      {/* Analysis Mode Information */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-3">
          <FaInfoCircle className="text-blue-400 mr-2" />
          <h3 className="text-lg font-medium text-blue-300">Analysis Modes</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded p-3">
            <div className="flex items-center mb-2">
              <FaGlobe className="text-green-400 mr-2" />
              <span className="font-medium text-green-300">Public Analysis</span>
            </div>
            <p className="text-xs text-gray-300">
              Enter social media handles/usernames. We use advanced search strategies to find publicly available content from only the platforms where you provide handles.
            </p>
            <div className="mt-2 text-xs text-green-200">
              <span className="font-medium">Supported:</span> X/Twitter, LinkedIn, Reddit, YouTube, GitHub
            </div>
          </div>
          <div className="bg-gray-800/50 rounded p-3">
            <div className="flex items-center mb-2">
              <FaLock className="text-purple-400 mr-2" />
              <span className="font-medium text-purple-300">Connected Analysis</span>
            </div>
            <p className="text-xs text-gray-300">
              {isAuthenticated ? 'Sign in and connect accounts for deeper analysis with full content access and private data.' : 'Available when signed in - provides comprehensive analysis with authenticated APIs.'}
            </p>
            <div className="mt-2 text-xs text-purple-200">
              <span className="font-medium">Benefits:</span> Full content access, private data, detailed analytics
            </div>
          </div>
        </div>
        
        {/* Platform-specific notes */}
        <div className="mt-4 p-3 bg-blue-900/10 border border-blue-700/20 rounded text-xs">
          <div className="flex items-center mb-2">
            <FaSearch className="text-blue-400 mr-1" />
            <span className="font-medium text-blue-300">Platform Search Strategies</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-300">
            <div><strong>X/Twitter:</strong> Multi-strategy Google search via SerpAPI</div>
            <div><strong>LinkedIn:</strong> Professional profile and content search</div>
            <div><strong>Reddit:</strong> User posts, comments, and mention detection</div>
            <div><strong>YouTube:</strong> Channel and video content discovery</div>
            <div><strong>GitHub:</strong> Profile, repositories, and activity analysis</div>
            <div><strong>Instagram:</strong> Public profile search via Google (limited to indexed content)</div>
          </div>
        </div>
      </div>
      
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Name*
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaUser className="text-gray-400" />
          </div>
          <input 
            name="name" 
            type="text" 
            required 
            value={form.name} 
            onChange={handleChange}
            className="glass-input w-full pl-10" 
            placeholder="Full name of the person" 
          />
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-medium text-gray-200">Social Media Accounts</h3>
          {isAuthenticated && (
            <span className="text-sm text-green-400">
              {connectedAccounts.length} connected
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="flex items-center text-sm font-medium text-gray-300 mb-1">
              X (Twitter)
              {connectedAccounts.includes('twitter') && (
                <span className="ml-2 text-xs bg-green-600 text-green-100 px-2 py-0.5 rounded">Connected</span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaTwitter className="text-blue-400" />
              </div>
              <input 
                name="twitter" 
                type="text" 
                value={form.twitter || ""} 
                onChange={handleChange}
                className="glass-input w-full pl-10" 
                placeholder={connectedAccounts.includes('twitter') ? '@username (connected)' : '@username, x.com/username, or twitter.com/username'}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="flex items-center text-sm font-medium text-gray-300 mb-1">
              LinkedIn
              {connectedAccounts.includes('linkedin') && (
                <span className="ml-2 text-xs bg-green-600 text-green-100 px-2 py-0.5 rounded">Connected</span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLinkedin className="text-blue-500" />
              </div>
              <input 
                name="linkedin" 
                type="text" 
                value={form.linkedin || ""} 
                onChange={handleChange}
                className="glass-input w-full pl-10" 
                placeholder={connectedAccounts.includes('linkedin') ? 'username (connected)' : 'linkedin.com/in/username or just username'}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="flex items-center text-sm font-medium text-gray-300 mb-1">
              Reddit
              {connectedAccounts.includes('reddit') && (
                <span className="ml-2 text-xs bg-green-600 text-green-100 px-2 py-0.5 rounded">Connected</span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaReddit className="text-orange-500" />
              </div>
              <input 
                name="reddit" 
                type="text" 
                value={form.reddit || ""} 
                onChange={handleChange}
                className="glass-input w-full pl-10" 
                placeholder={connectedAccounts.includes('reddit') ? 'u/username (connected)' : 'u/username or reddit.com/u/username'}
              />
            </div>
          </div>
        
          <div className="form-group">
            <label className="flex items-center text-sm font-medium text-gray-300 mb-1">
              YouTube
              {connectedAccounts.includes('youtube') && (
                <span className="ml-2 text-xs bg-green-600 text-green-100 px-2 py-0.5 rounded">Connected</span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaYoutube className="text-red-500" />
              </div>
              <input 
                name="youtube" 
                type="text" 
                value={form.youtube || ""} 
                onChange={handleChange}
                className="glass-input w-full pl-10" 
                placeholder={connectedAccounts.includes('youtube') ? 'Channel name (connected)' : 'youtube.com/@channel or channel name'}
              />
            </div>
          </div>
        
          <div className="form-group">
            <label className="flex items-center text-sm font-medium text-gray-300 mb-1">
              Instagram
              {connectedAccounts.includes('instagram') && (
                <span className="ml-2 text-xs bg-green-600 text-green-100 px-2 py-0.5 rounded">Connected</span>
              )}
              <span className="ml-1 text-xs text-blue-400 bg-blue-900/30 px-1 rounded">Search</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaInstagram className="text-pink-500" />
              </div>
              <input 
                name="instagram" 
                type="text" 
                value={form.instagram || ""} 
                onChange={handleChange}
                className="glass-input w-full pl-10" 
                placeholder={connectedAccounts.includes('instagram') ? '@username (connected)' : '@username or instagram.com/username (public search)'}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="flex items-center text-sm font-medium text-gray-300 mb-1">
              GitHub
              {connectedAccounts.includes('github') && (
                <span className="ml-2 text-xs bg-green-600 text-green-100 px-2 py-0.5 rounded">Connected</span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaGithub className="text-gray-300" />
              </div>
              <input 
                name="github" 
                type="text" 
                value={form.github || ""} 
                onChange={handleChange}
                className="glass-input w-full pl-10" 
                placeholder={connectedAccounts.includes('github') ? 'username (connected)' : 'github.com/username or just username'}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input 
                name="email" 
                type="email" 
                value={form.email || ""} 
                onChange={handleChange}
                className="glass-input w-full pl-10" 
                placeholder="email@example.com" 
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="form-group mt-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Photo (Optional)
        </label>
        <div className="relative">
          <div className="flex items-center">
            <label className="flex items-center justify-center px-4 py-2 bg-gray-800 text-white rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
              <FaImage className="mr-2" />
              {fileName ? 'Change Photo' : 'Upload Photo'}
              <input 
                name="photo" 
                type="file" 
                accept="image/*" 
                onChange={handleChange}
                className="hidden" 
              />
            </label>
            {fileName && (
              <span className="ml-3 text-sm text-gray-300 truncate max-w-[200px]">{fileName}</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">Upload a photo to improve matching accuracy</p>
        </div>
      </div>
      
      <button 
        type="submit" 
        disabled={disabled}
        className={`w-full py-3 px-4 mt-6 font-medium rounded-lg flex items-center justify-center shadow-lg transition-all duration-200 ${
          disabled 
            ? 'bg-gray-600 cursor-not-allowed text-gray-400' 
            : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/20 hover:shadow-violet-600/30'
        }`}
      >
        <span>{disabled ? 'Processing...' : 'Analyze Reputation'}</span>
        {!disabled && <FaArrowRight className="ml-2" />}
      </button>
    </form>
  );
});

UserInputForm.displayName = 'UserInputForm';

export default UserInputForm;