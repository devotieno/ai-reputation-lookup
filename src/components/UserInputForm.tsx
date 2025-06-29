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
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-8">
        {/* Header */}
        <h2 className="text-2xl font-bold text-center text-white mb-8">AI Reputation Lookup</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name - Top Row */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Full Name*
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaUser className="text-blue-400 text-lg" />
              </div>
              <input 
                name="name" 
                type="text" 
                required 
                value={form.name} 
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                placeholder="Enter full name" 
              />
            </div>
          </div>

          {/* Two Columns Layout for Social Media + Email and Photo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column - Social Media & Email (4 rows) */}
            <div className="space-y-4">
              
              {/* X/Twitter */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-200 mb-2">
                  <FaTwitter className="text-blue-400 mr-2" />
                  X (Twitter)
                  {connectedAccounts.includes('twitter') && (
                    <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">Connected</span>
                  )}
                </label>
                <input 
                  name="twitter" 
                  type="text" 
                  value={form.twitter || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" 
                  placeholder="@username"
                />
              </div>

              {/* LinkedIn */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-200 mb-2">
                  <FaLinkedin className="text-blue-500 mr-2" />
                  LinkedIn
                  {connectedAccounts.includes('linkedin') && (
                    <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">Connected</span>
                  )}
                </label>
                <input 
                  name="linkedin" 
                  type="text" 
                  value={form.linkedin || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  placeholder="linkedin.com/in/username"
                />
              </div>

              {/* Reddit */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-200 mb-2">
                  <FaReddit className="text-orange-500 mr-2" />
                  Reddit
                  {connectedAccounts.includes('reddit') && (
                    <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">Connected</span>
                  )}
                </label>
                <input 
                  name="reddit" 
                  type="text" 
                  value={form.reddit || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" 
                  placeholder="u/username"
                />
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-200 mb-2">
                  <FaEnvelope className="text-gray-400 mr-2" />
                  Email
                </label>
                <input 
                  name="email" 
                  type="email" 
                  value={form.email || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all" 
                  placeholder="email@example.com"
                />
              </div>
            </div>

            {/* Right Column - Additional Social Media & Photo (4 rows) */}
            <div className="space-y-4">
              
              {/* YouTube */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-200 mb-2">
                  <FaYoutube className="text-red-500 mr-2" />
                  YouTube
                  {connectedAccounts.includes('youtube') && (
                    <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">Connected</span>
                  )}
                </label>
                <input 
                  name="youtube" 
                  type="text" 
                  value={form.youtube || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" 
                  placeholder="@channel"
                />
              </div>

              {/* Instagram */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-200 mb-2">
                  <FaInstagram className="text-pink-500 mr-2" />
                  Instagram
                  {connectedAccounts.includes('instagram') && (
                    <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">Connected</span>
                  )}
                </label>
                <input 
                  name="instagram" 
                  type="text" 
                  value={form.instagram || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all" 
                  placeholder="@username"
                />
              </div>

              {/* GitHub */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-200 mb-2">
                  <FaGithub className="text-gray-300 mr-2" />
                  GitHub
                  {connectedAccounts.includes('github') && (
                    <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">Connected</span>
                  )}
                </label>
                <input 
                  name="github" 
                  type="text" 
                  value={form.github || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all" 
                  placeholder="username"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Photo (Optional)
                </label>
                <div className="relative">
                  <label className="flex items-center justify-center w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg cursor-pointer hover:bg-white/10 transition-all group">
                    <FaImage className="text-blue-400 mr-2 group-hover:text-blue-300" />
                    <span className="text-gray-300 group-hover:text-white">
                      {fileName ? fileName : 'Upload Photo'}
                    </span>
                    <input 
                      name="photo" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleChange}
                      className="hidden" 
                    />
                  </label>
                  {fileName && (
                    <p className="text-xs text-green-400 mt-1">✓ Photo uploaded</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button - Bottom Row */}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={disabled}
              className={`w-full py-4 px-6 font-semibold rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg text-lg tracking-wide
                ${disabled 
                  ? 'bg-gradient-to-r from-gray-500 to-gray-700 cursor-not-allowed text-gray-300 shadow-none' 
                  : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white shadow-xl hover:scale-105 active:scale-98 border-2 border-white/10'}
              `}
              style={{ boxShadow: disabled ? undefined : '0 4px 24px 0 rgba(99,102,241,0.15), 0 1.5px 6px 0 rgba(168,85,247,0.10)' }}
            >
              {disabled ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mr-3"></div>
                  Processing...
                </>
              ) : (
                <>
                  <span className="text-lg font-bold drop-shadow">Analyze Reputation</span>
                  <FaArrowRight className="ml-3 text-xl drop-shadow" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

UserInputForm.displayName = 'UserInputForm';

export default UserInputForm;