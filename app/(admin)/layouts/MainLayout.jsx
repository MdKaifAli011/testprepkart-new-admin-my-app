"use client";
import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuToggle={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <main className="pt-16 lg:ml-64 lg:pt-20 px-6 py-10 transition-all duration-300 ease-in-out">
        <div className="w-full max-w-7xl mx-auto">
          <div className="space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
