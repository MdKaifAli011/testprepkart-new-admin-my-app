"use client";
import Image from "next/image";
import Link from "next/link";
import { FaUser, FaSignOutAlt, FaBars } from "react-icons/fa";

const Header = ({ onMenuToggle }) => (
  <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-lg shadow-gray-200/50">
    <div className="flex relative items-center justify-between h-full px-3 md:px-6 lg:px-8">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95"
        aria-label="Toggle menu"
      >
        <FaBars className="text-xl" />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Image
            src="/logo.png"
            alt="TestPrepKart Logo"
            width={150}
            height={150}
            className="w-28 sm:w-36 h-auto ml-2 lg:ml-0 transition-transform duration-300 hover:scale-105"
            priority
            loading="eager"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+"
          />
        </div>
      </div>

      {/* Centered Title */}
      <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-base sm:text-lg md:text-xl lg:text-2xl hidden sm:flex items-center gap-2">
        <span className="text-gray-900">Admin</span>
        <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></span>
        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Dashboard
        </span>
      </h1>

      {/* User & Logout Group */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* User Info Block */}
        <div className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group">
          <div className="relative">
            <div className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30 group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
              <FaUser className="text-sm md:text-base" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-green-500 border-2 border-white shadow-sm animate-pulse" />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="font-bold text-sm text-gray-900 leading-tight">Admin</span>
            <span className="font-normal text-xs text-gray-500 leading-tight">
              Administrator
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <Link
          href="/logout"
          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-semibold text-white transition-all duration-200 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/40 hover:scale-105 active:scale-95"
        >
          <FaSignOutAlt className="text-xs md:text-sm" />
          <span className="hidden sm:inline">Logout</span>
        </Link>
      </div>
    </div>
  </header>
);

export default Header;
