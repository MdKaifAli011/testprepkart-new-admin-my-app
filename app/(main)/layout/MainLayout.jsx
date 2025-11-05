"use client";

import React, { Suspense, lazy } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

// Lazy load heavy components
const LazySidebar = lazy(() => import("./Sidebar"));

const MainLayout = ({ children }) => {
  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Navbar */}
        <Navbar />

        {/* Sidebar + Main Content */}
        <div className="flex flex-1">
          {/* Sidebar (visible on large screens, fixed height) */}
          <Suspense
            fallback={
              <aside className="w-72 bg-white border-r border-gray-200 hidden lg:block shadow-sm">
                <div className="p-6 space-y-5 animate-pulse">
                  <div className="h-10 bg-gray-200 rounded-lg"></div>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-6 bg-gray-200 rounded-md"></div>
                  ))}
                </div>
              </aside>
            }
          >
            <Sidebar />
          </Suspense>

          {/* Main content */}
          <main className="flex-1 p-4 md:p-6 bg-white overflow-y-auto">
            <div className="w-full max-w-7xl mx-auto">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                      <p className="text-gray-600">Loading...</p>
                    </div>
                  </div>
                }
              >
                {children}
              </Suspense>
            </div>
          </main>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default MainLayout;
