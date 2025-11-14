"use client";

import React, { Suspense, useState } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Prevent body scroll when sidebar is open on mobile
  React.useEffect(() => {
    let timeoutId = null;

    if (isSidebarOpen) {
      // Check if we're on mobile (viewport width < 1024px)
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        document.body.style.overflow = "hidden";
      }
    } else {
      // Only restore scroll if nav menu is also closed (handled by Navbar)
      // Small delay to ensure Navbar's useEffect runs first
      timeoutId = setTimeout(() => {
        if (!document.querySelector('[data-nav-menu-open="true"]')) {
          document.body.style.overflow = "";
        }
      }, 0);
    }

    return () => {
      // Cleanup timeout on unmount or dependency change
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Restore scroll on unmount if sidebar is closed
      if (!isSidebarOpen) {
        document.body.style.overflow = "";
      }
    };
  }, [isSidebarOpen]);

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Navbar */}
        <Navbar onMenuToggle={toggleSidebar} isMenuOpen={isSidebarOpen} />

        {/* Sidebar + Main Content */}
        <div className="flex flex-1 relative">
          {/* Sidebar - Mobile Drawer / Desktop Fixed */}
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-[40] lg:hidden"
              onClick={closeSidebar}
            />
          )}

          {/* Main content */}
          <main className="flex-1 p-4 md:p-6 bg-white overflow-y-auto w-full lg:w-auto">
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
