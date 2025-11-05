"use client";
import React, { memo } from "react";
import Link from "next/link";
import { FaCheck, FaEye } from "react-icons/fa";

const ListItem = memo(({ item, index, href, color }) => {
  // Color variants for the vertical bar
  const colorVariants = {
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    green: "bg-green-500",
    black: "bg-black",
    indigo: "bg-indigo-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
  };

  // Get color based on index if color not provided
  const getColor = () => {
    if (color) return colorVariants[color] || colorVariants.blue;
    const colors = ["blue", "blue", "yellow", "green", "black"];
    return colorVariants[colors[index % colors.length]] || colorVariants.blue;
  };

  // Mock data - replace with actual data from API
  const weightage = item.weightage || "20%";
  const engagement = item.engagement || "2.2K";
  const isCompleted = item.isCompleted || false;
  const progress = item.progress || (isCompleted ? 100 : 0);

  const content = (
    <div className="flex items-center gap-4 w-full">
      {/* Vertical Colored Bar */}
      <div className={`w-1 h-16 ${getColor()} rounded-full flex-shrink-0`}></div>

      {/* Left Section - Topic Info */}
      <div className="flex-1 min-w-0 py-2">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-base font-bold text-gray-900 truncate">
            {item.name}
          </h3>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Weightage: {weightage}</span>
          <div className="flex items-center gap-1">
            <FaEye className="text-gray-400 text-xs" />
            <span>{engagement}</span>
          </div>
        </div>
      </div>

      {/* Status Column */}
      <div className="w-32 flex justify-center flex-shrink-0">
        {isCompleted ? (
          <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
            <FaCheck className="text-white text-xs" />
          </div>
        ) : (
          <span className="text-sm text-gray-500">Mark as Done</span>
        )}
      </div>

      {/* Progress Column */}
      <div className="w-32 flex items-center gap-2 flex-shrink-0">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              progress === 100 ? "bg-green-500" : "bg-gray-400"
            } transition-all duration-300`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="text-xs text-gray-600 w-8 text-right">{progress}%</span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all p-4"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {content}
    </div>
  );
});

ListItem.displayName = "ListItem";

export default ListItem;

