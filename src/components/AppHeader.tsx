"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { FaUserCircle, FaCog, FaSignOutAlt, FaShieldAlt } from "react-icons/fa";
import { motion } from "framer-motion";

export default function AppHeader() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 bg-gray-900/60 backdrop-blur-md border-b border-gray-800/50">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center group">
          <div className="relative mr-3">
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="relative z-10"
            >
              <FaShieldAlt className="h-7 w-7 text-violet-500 group-hover:text-violet-400 transition-colors" />
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="absolute inset-0 bg-violet-500/20 rounded-full blur-md"
            />
          </div>
          <div>
            <motion.span 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-xl font-bold text-white tracking-tight block"
            >
              AI Reputation Lookup
            </motion.span>
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-xs text-gray-400 block"
            >
              Comprehensive Online Analysis
            </motion.span>
          </div>
        </Link>
        
        <div className="flex items-center space-x-4">
          {!session ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => signIn("google")}
              className="flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white transition-all shadow-lg shadow-violet-600/20"
            >
              <FaUserCircle className="mr-2" />
              Sign In
            </motion.button>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/settings"
                className="p-2 rounded-lg bg-gray-800/70 hover:bg-violet-700/50 text-white transition-all"
                title="Settings"
              >
                <FaCog />
              </Link>
              
              <div className="flex items-center bg-gray-800/70 rounded-lg px-3 py-1.5">
                {session.user?.image && (
                  <div className="relative">
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full mr-2 border-2 border-violet-500"
                    />
                    <div className="absolute bottom-0 right-1.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-900"></div>
                  </div>
                )}
                <span className="text-white hidden sm:inline font-medium">{session.user?.name}</span>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "#991b1b" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => signOut()}
                className="p-2 rounded-lg bg-gray-800/70 hover:bg-red-800/70 text-white transition-all"
                title="Sign Out"
              >
                <FaSignOutAlt />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
