"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaUser,
  FaBook,
  FaLayerGroup,
  FaRegFolderOpen,
  FaClipboardList,
  FaUserTag,
  FaTimes,
} from "react-icons/fa";

const MENU_ITEMS = [
  { name: "Exam Management", href: "/admin/exam", icon: FaClipboardList },
  { name: "Subject Management", href: "/admin/subject", icon: FaBook },
  { name: "Unit Management", href: "/admin/unit", icon: FaLayerGroup },
  { name: "Chapter Management", href: "/admin/chapter", icon: FaRegFolderOpen },
  { name: "Topic Management", href: "/admin/topic", icon: FaRegFolderOpen },
  {
    name: "Sub Topic Management",
    href: "/admin/sub-topic",
    icon: FaRegFolderOpen,
  },
  { name: "User Role Management", href: "/admin/user-role", icon: FaUserTag },
];

const Sidebar = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const isActive = (href) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Overlay for mobile with fade animation */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden animate-fade-in transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar with slide animation */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-72 flex flex-col bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 shadow-2xl shadow-gray-900/10 transition-all duration-300 ease-in-out border-r border-gray-200/80 backdrop-blur-md ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200/80 bg-gradient-to-r from-white/90 to-blue-50/50 backdrop-blur-sm lg:hidden">
          <span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-sm uppercase tracking-wide">
            Navigation
          </span>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:rotate-90 hover:bg-red-50 rounded-lg transition-all duration-300 active:scale-95"
            aria-label="Close menu"
          >
            <FaTimes className="text-lg transition-transform duration-300" />
          </button>
        </div>

        {/* Desktop Header Spacer */}
        <div className="hidden lg:block h-16 border-b border-gray-200/80 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-transparent backdrop-blur-sm" />

        {/* Navigation Links with stagger animation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="flex flex-col gap-2">
            {MENU_ITEMS.map(({ name, href, icon: Icon }, index) => {
              const active = isActive(href);
              return (
                <Link
                  href={href}
                  key={name}
                  onClick={onClose}
                  className={`
                    group flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-300 relative
                    ${
                      active
                        ? "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/40 scale-[1.02] border border-blue-400/30"
                        : "text-gray-700 font-medium hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50/50 hover:text-blue-700 hover:shadow-md hover:scale-[1.01] border border-transparent hover:border-blue-200/50"
                    }
                  `}
                  style={
                    isOpen
                      ? {
                          animation: `slideInLeft 0.4s ease-out ${
                            index * 0.05
                          }s both`,
                        }
                      : {}
                  }
                >
                  <div
                    className={`
                      flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 flex-shrink-0
                      ${
                        active
                          ? "bg-white/20 text-white shadow-sm"
                          : "bg-gradient-to-br from-gray-100 to-gray-50 text-gray-600 group-hover:from-blue-100 group-hover:to-indigo-100 group-hover:text-blue-600 shadow-sm"
                      }
                    `}
                  >
                    <Icon className="text-base transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <span className="flex-1 leading-tight font-medium whitespace-nowrap overflow-hidden text-ellipsis min-w-0">{name}</span>
                  {active && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-white shadow-md animate-pulse" />
                  )}
                  {!active && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-gradient-to-b from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer Section */}
        <div className="p-4 mt-auto border-t border-gray-200/80 bg-gradient-to-b from-white/80 via-blue-50/30 to-indigo-50/20 backdrop-blur-sm">
          <Link
            href="/admin/profile"
            onClick={onClose}
            className={`group flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative mb-4 ${
              pathname === "/admin/profile"
                ? "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/40 border border-blue-400/30"
                : "text-gray-700 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50/50 hover:shadow-md border border-transparent hover:border-blue-200/50"
            }`}
          >
            <div
              className={`
                flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300 shadow-sm flex-shrink-0
                ${
                  pathname === "/admin/profile"
                    ? "bg-white/20 text-white"
                    : "bg-gradient-to-br from-gray-100 to-gray-50 text-gray-600 group-hover:from-blue-100 group-hover:to-indigo-100 group-hover:text-blue-600"
                }
              `}
            >
              <FaUser className="text-base transition-transform duration-300 group-hover:scale-110" />
            </div>
            <span className="flex-1 font-medium whitespace-nowrap overflow-hidden text-ellipsis min-w-0">Profile Settings</span>
            {pathname === "/admin/profile" && (
              <div className="ml-auto w-2 h-2 rounded-full bg-white shadow-md animate-pulse" />
            )}
          </Link>
          <div className="px-3 py-3 bg-gradient-to-br from-gray-50/80 to-blue-50/30 rounded-xl border border-gray-200/50 shadow-sm backdrop-blur-sm">
            <div className="text-xs text-center font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Admin Panel
            </div>
            <div className="text-xs text-center text-gray-500 mt-1 font-medium">v1.0</div>
          </div>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
