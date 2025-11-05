"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  FaInstagram,
  FaFacebook,
  FaWhatsapp,
  FaYoutube,
  FaTwitter,
  FaLinkedin,
  FaSearch,
  FaUser,
  FaTh,
  FaBars,
  FaChevronDown,
} from "react-icons/fa";
import Image from "next/image";

const Navbar = ({ onMenuToggle, isMenuOpen }) => {
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  // Handle default props
  const handleMenuToggle = onMenuToggle || (() => {});

  // Prevent body scroll when nav menu is open on mobile
  React.useEffect(() => {
    if (isNavMenuOpen) {
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        document.body.style.overflow = "hidden";
      }
    } else {
      // Only restore scroll if sidebar is also closed
      if (!isMenuOpen) {
        document.body.style.overflow = "";
      }
    }

    return () => {
      if (!isMenuOpen) {
        document.body.style.overflow = "";
      }
    };
  }, [isNavMenuOpen, isMenuOpen]);

  const navLinks = [
    "Examinations",
    "Courses",
    "Utilities",
    "Downloads",
    "Contact",
  ];

  return (
    <nav className="w-full">
      {/* Top Bar - Dark Gray */}
      <div className="bg-gray-800 text-white text-xs py-2 hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Social Media Engagement */}
            <div className="flex items-center gap-3 xl:gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <FaInstagram className="text-xs sm:text-sm" />
                <span className="hidden sm:inline">100k Followers</span>
                <span className="sm:hidden">100k</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FaFacebook className="text-xs sm:text-sm" />
                <span className="hidden sm:inline">500k Followers</span>
                <span className="sm:hidden">500k</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FaWhatsapp className="text-xs sm:text-sm" />
                <span className="hidden lg:inline">+1 (510) 706-9331</span>
                <span className="lg:hidden hidden sm:inline">
                  +1 (510) 706-9331
                </span>
              </div>
            </div>

            {/* Center: Hot Button with Message */}
            <div className="flex items-center gap-2">
              <button className="bg-blue-600 px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap">
                <span>Hot</span>
                <span className="text-xs">👏</span>
              </button>
              <span className="text-xs hidden xl:inline">
                Schedule Your Free Exam Readiness Analysis Session!
              </span>
            </div>

            {/* Right: Social Media Icons */}
            <div className="flex items-center gap-2 xl:gap-3">
              <FaYoutube className="text-xs sm:text-sm cursor-pointer hover:text-blue-400 transition-colors" />
              <FaFacebook className="text-xs sm:text-sm cursor-pointer hover:text-blue-400 transition-colors" />
              <FaTwitter className="text-xs sm:text-sm cursor-pointer hover:text-blue-400 transition-colors" />
              <FaLinkedin className="text-xs sm:text-sm cursor-pointer hover:text-blue-400 transition-colors hidden lg:inline" />
              <FaInstagram className="text-xs sm:text-sm cursor-pointer hover:text-blue-400 transition-colors hidden lg:inline" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar - White */}
      <div className="bg-white shadow-md sticky top-0 z-[60] w-full">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between py-2 sm:py-3">
            {/* Left: Logo */}
            <div className="flex items-center shrink-0">
              <Image
                src="/logo.png"
                alt="TestPrepKart Logo"
                width={150}
                height={150}
                className="w-24 sm:w-28 md:w-32 lg:w-36 h-auto"
                priority
                loading="eager"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+"
              />
            </div>

            {/* Center: Category Button & Navigation Links */}
            <div className="hidden lg:flex items-center gap-3 xl:gap-4 flex-1 justify-center font-semibold">
              {/* Category Button */}
              <button className="flex items-center gap-2 px-3 xl:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700 whitespace-nowrap">
                <FaTh className="text-sm" />
                <span>Category</span>
              </button>

              {/* Navigation Links */}
              <nav className="flex items-center gap-0.5 xl:gap-1 font-semibold">
                {navLinks.map((link) => (
                  <Link
                    key={link}
                    href="#"
                    className="flex items-center gap-1 px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors group whitespace-nowrap"
                  >
                    <span>{link}</span>
                    <FaChevronDown className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right: Search, Sign In, Enroll Now */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search Icon */}
              <button
                className="p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 transition-colors"
                aria-label="Search"
              >
                <FaSearch className="text-base sm:text-lg" />
              </button>

              {/* Sign In */}
              <Link
                href="#"
                className="hidden md:flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                <FaUser className="text-xs sm:text-sm" />
                <span>Sign In</span>
              </Link>

              {/* Enroll Now Button */}
              <Link
                href="#"
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
              >
                <span className="hidden sm:inline">Enroll Now</span>
                <span className="sm:hidden">Enroll</span>
              </Link>

              {/* Mobile Menu Buttons */}
              <div className="lg:hidden flex items-center gap-1">
                {/* Sidebar Menu Button - Controls Exam/Subject/Unit Navigation */}
                <button
                  onClick={handleMenuToggle}
                  className="p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 transition-colors relative"
                  aria-label="Toggle navigation menu"
                  title="Navigation Menu"
                >
                  <FaBars className="text-base sm:text-lg" />
                </button>

                {/* Nav Menu Button - Controls Category/Examinations/Courses */}
                <button
                  onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
                  className="p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 transition-colors relative"
                  aria-label="Toggle main menu"
                  title="Main Menu"
                >
                  <FaTh className="text-base sm:text-lg" />
                  {isNavMenuOpen && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu - Category, Examinations, Courses, etc. */}
          {isNavMenuOpen && (
            <>
              {/* Mobile Overlay for Nav Menu */}
              <div
                className="fixed inset-0 z-[45] lg:hidden"
                onClick={() => setIsNavMenuOpen(false)}
              />

              {/* Mobile Menu Dropdown */}
              <div
                data-nav-menu
                data-nav-menu-open={isNavMenuOpen ? "true" : "false"}
                className="lg:hidden border-t border-gray-200 bg-white absolute top-full left-0 right-0 z-[55] shadow-lg max-h-[calc(100vh-200px)] overflow-y-auto"
              >
                <div className="p-4 space-y-2">
                  {/* Category Button */}
                  <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                    <FaTh className="text-sm" />
                    <span>Category</span>
                  </button>

                  {/* Navigation Links */}
                  {navLinks.map((link) => (
                    <Link
                      key={link}
                      href="#"
                      className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors rounded-lg"
                      onClick={() => setIsNavMenuOpen(false)}
                    >
                      <span>{link}</span>
                      <FaChevronDown className="text-xs text-gray-400" />
                    </Link>
                  ))}

                  {/* Sign In Link */}
                  <Link
                    href="#"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors rounded-lg"
                    onClick={() => setIsNavMenuOpen(false)}
                  >
                    <FaUser className="text-sm" />
                    <span>Sign In</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
