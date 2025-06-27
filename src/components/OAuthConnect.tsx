"use client";

import React from "react";
import { FaTwitter, FaLinkedin, FaReddit, FaYoutube, FaInstagram, FaLock } from "react-icons/fa";
import { motion } from "framer-motion";

const OAuthConnect: React.FC = () => {
  const socialButtons = [
    { 
      name: "LinkedIn", 
      href: "/api/auth/linkedin/start", 
      icon: <FaLinkedin size={20} />, 
      bgColor: "bg-gradient-to-br from-blue-700 to-blue-500",
      hoverEffect: "hover:shadow-blue-600/30" 
    },
    { 
      name: "Twitter", 
      href: "/api/auth/twitter/start", 
      icon: <FaTwitter size={20} />, 
      bgColor: "bg-gradient-to-br from-sky-600 to-blue-400",
      hoverEffect: "hover:shadow-blue-400/30" 
    },
    { 
      name: "Reddit", 
      href: "/api/auth/reddit/start", 
      icon: <FaReddit size={20} />, 
      bgColor: "bg-gradient-to-br from-orange-700 to-orange-500",
      hoverEffect: "hover:shadow-orange-500/30" 
    },
    { 
      name: "YouTube", 
      href: "/api/auth/youtube/start", 
      icon: <FaYoutube size={20} />, 
      bgColor: "bg-gradient-to-br from-red-700 to-red-500",
      hoverEffect: "hover:shadow-red-500/30" 
    },
    { 
      name: "Instagram", 
      href: "/api/auth/instagram/start", 
      icon: <FaInstagram size={20} />, 
      bgColor: "bg-gradient-to-br from-pink-600 to-purple-500",
      hoverEffect: "hover:shadow-purple-500/30" 
    },
  ];

  return (
    <div className="glass-panel p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-center mb-6">
        <FaLock className="text-violet-400 mr-2" />
        <h3 className="text-xl font-medium text-center gradient-text">
          Connect Social Accounts
        </h3>
      </div>
      
      <p className="text-sm text-gray-300 text-center mb-6">
        Securely connect your accounts to enable more comprehensive analysis. 
        Your credentials are never stored.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {socialButtons.map((social) => (
          <motion.a
            key={social.name}
            href={social.href}
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.97 }}
            className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg ${social.bgColor} shadow-lg ${social.hoverEffect} hover:shadow-lg transition-all duration-200`}
          >
            <span className="text-white mb-2">{social.icon}</span>
            <span className="text-sm text-white font-medium">{social.name}</span>
          </motion.a>
        ))}
      </div>
    </div>
  );
};

export default OAuthConnect;