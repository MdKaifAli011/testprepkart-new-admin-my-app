"use client";
import Image from "next/image";
import Link from "next/link";
import { FaUser, FaSignOutAlt, FaBars } from "react-icons/fa";

const Header = ({ onMenuToggle }) => (
  <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-200 shadow-md">
    <div className="flex relative items-center justify-between h-full px-3 md:px-6">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Toggle menu"
      >
        <FaBars className="text-xl" />
      </button>

      {/* Logo */}
      <Image
        src="/logo.png"
        alt="TestPrepKart Logo"
        width={150}
        height={150}
        className="w-28 sm:w-36 h-auto ml-2 lg:ml-0"
        priority
        loading="eager"
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+"
      />

      {/* Centered Title */}
      <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-base sm:text-lg md:text-xl hidden sm:block">
        <span className="text-gray-900">Admin</span>
        <span className="ml-2 text-blue-600">Dashboard</span>
      </h1>

      {/* User & Logout Group */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* User Info Block */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative">
            <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-white border border-gray-200">
              <FaUser className="text-gray-500 text-sm md:text-lg" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500 border-2 border-white" />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="font-bold text-sm text-gray-900">Admin</span>
            <span className="font-normal text-xs text-gray-500">
              Administrator
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <Link
          href="/logout"
          className="flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-bold text-white transition-colors rounded-lg bg-blue-600 hover:bg-blue-700 shadow-md md:shadow-lg shadow-blue-500/30"
        >
          <FaSignOutAlt className="text-xs md:text-sm" />
          <span className="hidden sm:inline">Logout</span>
        </Link>
      </div>
    </div>
  </header>
);

export default Header;
