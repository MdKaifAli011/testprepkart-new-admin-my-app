"use client";
import React from "react";

// Base skeleton component with design system alignment
const SkeletonBase = ({ className = "", ...props }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded-lg ${className}`}
    {...props}
  />
);

// Skeleton for text lines with design system typography
export const SkeletonText = ({
  lines = 1,
  className = "",
  width = "w-full",
  height = "h-4",
  variant = "default",
}) => {
  const heightClasses = {
    small: "h-3",      // 12px - text-xs
    default: "h-4",    // 16px - text-sm
    large: "h-5",      // 20px - text-base
    xlarge: "h-6",     // 24px - text-xl
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBase
          key={index}
          className={`${width} ${heightClasses[variant] || height} ${
            index === lines - 1 ? "w-3/4" : ""
          }`}
        />
      ))}
    </div>
  );
};

// Skeleton for buttons with design system sizing
export const SkeletonButton = ({ className = "", size = "default" }) => {
  const sizeClasses = {
    small: "h-8 w-20",    // px-3 py-1.5 equivalent
    default: "h-10 w-24", // px-4 py-2 equivalent
    large: "h-12 w-32",   // px-6 py-3 equivalent
  };

  return (
    <SkeletonBase className={`rounded-lg ${sizeClasses[size]} ${className}`} />
  );
};

// Skeleton for cards with design system styling
export const SkeletonCard = ({ className = "" }) => (
  <div
    className={`bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 ${className}`}
  >
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SkeletonBase className="h-8 w-48" />
        <SkeletonButton />
      </div>
      <SkeletonText lines={2} width="w-full sm:w-3/4" />
      <div className="flex gap-2">
        <SkeletonButton size="small" />
        <SkeletonButton size="small" />
      </div>
    </div>
  </div>
);

// Skeleton for table rows with design system styling
export const SkeletonTableRow = ({ columns = 4, hasDragHandle = false }) => (
  <tr className="hover:bg-gray-50 transition-colors">
    {hasDragHandle && (
      <td className="px-6 py-4">
        <SkeletonBase className="h-4 w-4 rounded" />
      </td>
    )}
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="px-6 py-4">
        <SkeletonBase
          className={`h-4 ${
            index === 0 ? "w-32" : index === columns - 1 ? "w-20" : "w-full"
          }`}
        />
      </td>
    ))}
  </tr>
);

// Skeleton for table with design system styling
export const SkeletonTable = ({
  rows = 5,
  columns = 4,
  className = "",
  hasDragHandle = false,
}) => (
  <div
    className={`overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
  >
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {hasDragHandle && <th className="px-6 py-3 w-12"></th>}
          {Array.from({ length: columns }).map((_, index) => (
            <th key={index} className="px-6 py-3">
              <SkeletonBase className="h-4 w-20" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, index) => (
          <SkeletonTableRow
            key={index}
            columns={columns}
            hasDragHandle={hasDragHandle}
          />
        ))}
      </tbody>
    </table>
  </div>
);

// Loading spinner component with design system styling
export const LoadingSpinner = ({ size = "default", className = "" }) => {
  const sizeClasses = {
    small: "h-4 w-4",     // 16px
    default: "h-6 w-6",   // 24px
    large: "h-8 w-8",     // 32px
    xlarge: "h-12 w-12",  // 48px
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}
    />
  );
};

// Loading state wrapper with design system styling
export const LoadingWrapper = ({ isLoading, children, skeleton }) => {
  if (isLoading) {
    return (
      <div className="animate-fadeIn">
        {skeleton || <SkeletonTable rows={5} columns={4} />}
      </div>
    );
  }
  return children;
};

// Skeleton for page content with design system styling
export const SkeletonPageContent = () => (
  <div className="space-y-6">
    {/* Header Section */}
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SkeletonBase className="h-8 w-48" />
          <SkeletonButton />
        </div>
        <SkeletonText lines={2} width="w-full sm:w-3/4" variant="large" />
      </div>
    </div>

    {/* Table Section */}
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="space-y-2">
          <SkeletonBase className="h-6 w-32" />
          <SkeletonBase className="h-4 w-64" />
        </div>
      </div>
      <div className="p-6">
        <SkeletonTable rows={5} columns={4} />
      </div>
    </div>
  </div>
);

// Specialized skeleton for chapters table (with drag handle)
export const SkeletonChaptersTable = () => (
  <div className="space-y-6">
    {/* Header Section */}
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SkeletonBase className="h-8 w-48" />
          <SkeletonButton />
        </div>
        <SkeletonText lines={2} width="w-full sm:w-3/4" variant="large" />
      </div>
    </div>

    {/* Table Section */}
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="space-y-2">
          <SkeletonBase className="h-6 w-32" />
          <SkeletonBase className="h-4 w-64" />
        </div>
      </div>
      <div className="p-6">
        <SkeletonTable rows={5} columns={6} hasDragHandle={true} />
      </div>
    </div>
  </div>
);

export default SkeletonBase;

