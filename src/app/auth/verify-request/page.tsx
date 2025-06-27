"use client";

import { FiMail } from "react-icons/fi";
import Link from "next/link";

export default function VerifyRequest() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <FiMail className="mx-auto h-12 w-12 text-blue-500" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Check your email
          </h2>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              A sign in link has been sent to your email address.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Please check your email (including spam folder) for the verification link.
            </p>
            <Link href="/auth/signin" className="text-blue-600 hover:text-blue-800 font-medium">
              Return to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}