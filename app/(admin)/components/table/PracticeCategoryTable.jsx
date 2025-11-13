"use client";
import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { FaEdit, FaTrash, FaPowerOff, FaLock } from "react-icons/fa";
import {
  usePermissions,
  getPermissionMessage,
} from "../../hooks/usePermissions";

const PracticeCategoryTable = ({
  categories,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const { canEdit, canDelete, canReorder, role } = usePermissions();
  const router = useRouter();

  const handleCategoryClick = (category) => {
    router.push(`/admin/practice/category/${category._id || category.id}`);
  };

  // Group categories by Exam
  const groupedCategories = useMemo(() => {
    if (!categories || categories.length === 0) {
      return [];
    }
    const groups = {};
    categories.forEach((category) => {
      const examId = category.examId?._id || category.examId || "unassigned";
      const examName = category.examId?.name || "Unassigned";
      if (!groups[examId]) {
        groups[examId] = {
          examId,
          examName,
          categories: [],
        };
      }
      groups[examId].categories.push(category);
    });

    // Sort groups alphabetically by exam name
    return Object.values(groups).sort((a, b) =>
      a.examName.localeCompare(b.examName)
    );
  }, [categories]);

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="text-gray-400 text-6xl mb-4">📝</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Categories Found
        </h3>
        <p className="text-sm text-gray-500">
          Add your first category to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedCategories.map((group, groupIndex) => (
        <div
          key={group.examId}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
        >
          {/* Breadcrumb Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2.5 flex-wrap text-sm font-medium text-white">
              {/* Exam Name */}
              <span
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#10B981" }}
              >
                {group.examName}
              </span>
              <span className="text-gray-400">›</span>
              {/* Category Count */}
              <span
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#6B7280" }}
              >
                {group.categories.length}{" "}
                {group.categories.length === 1 ? "Category" : "Categories"}
              </span>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {group.examName} Paper Categories
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No. of Tests
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Language
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {group.categories.map((category, index) => (
                  <tr
                    key={category._id || category.id || index}
                    className={`hover:bg-gray-50 transition-colors ${
                      category.status === "inactive" ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        onClick={() => handleCategoryClick(category)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
                      >
                        {category.orderNumber
                          ? `${category.orderNumber}. `
                          : ""}
                        {category.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                              className="px-2 py-1 rounded-md text-xs font-medium text-white"
                              style={{ backgroundColor: "#3B82F6" }}
                            >
                              {category.subjectId?.name}
                            </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-900">
                        {category.noOfTests || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-600">
                        {category.mode || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-600">
                        {category.duration || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-600">
                        {category.language || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit &&
                          (canEdit ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(category);
                              }}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg transition-colors hover:bg-blue-100"
                              title="Edit Category"
                            >
                              <FaEdit className="text-sm" />
                            </button>
                          ) : (
                            <button
                              disabled
                              title={getPermissionMessage("edit", role)}
                              className="p-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                            >
                              <FaLock className="text-sm" />
                            </button>
                          ))}
                        {onDelete &&
                          (canDelete ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(category);
                              }}
                              className="p-2 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100"
                              title="Delete Category"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          ) : (
                            <button
                              disabled
                              title={getPermissionMessage("delete", role)}
                              className="p-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                            >
                              <FaLock className="text-sm" />
                            </button>
                          ))}
                        {onToggleStatus &&
                          (canReorder ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleStatus(category);
                              }}
                              className="p-2 bg-orange-50 text-orange-600 rounded-lg transition-colors hover:bg-orange-100"
                              title={
                                category.status === "active"
                                  ? "Deactivate Category"
                                  : "Activate Category"
                              }
                            >
                              <FaPowerOff className="text-sm" />
                            </button>
                          ) : (
                            <button
                              disabled
                              title={getPermissionMessage("reorder", role)}
                              className="p-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                            >
                              <FaLock className="text-sm" />
                            </button>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tablet/Mobile View */}
          <div className="lg:hidden divide-y divide-gray-200">
            {group.categories.map((category, index) => (
              <div
                key={category._id || category.id || index}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  category.status === "inactive" ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3
                      onClick={() => handleCategoryClick(category)}
                      className={`text-base font-semibold mb-2 cursor-pointer transition-colors ${
                        category.status === "inactive"
                          ? "text-gray-500 line-through"
                          : "text-blue-600 hover:text-blue-800"
                      }`}
                    >
                      {category.orderNumber ? `${category.orderNumber}. ` : ""}
                      {category.name}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Subject:</span>{" "}
                        {category.subjectId?.name || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">No. of Tests:</span>{" "}
                        {category.noOfTests || 0}
                      </div>
                      <div>
                        <span className="font-medium">Mode:</span>{" "}
                        {category.mode || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>{" "}
                        {category.duration || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Language:</span>{" "}
                        {category.language || "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {onEdit &&
                      (canEdit ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(category);
                          }}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg transition-colors hover:bg-blue-100"
                          title="Edit Category"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                      ) : (
                        <button
                          disabled
                          title={getPermissionMessage("edit", role)}
                          className="p-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                        >
                          <FaLock className="text-sm" />
                        </button>
                      ))}
                    {onDelete &&
                      (canDelete ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(category);
                          }}
                          className="p-2 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100"
                          title="Delete Category"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      ) : (
                        <button
                          disabled
                          title={getPermissionMessage("delete", role)}
                          className="p-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                        >
                          <FaLock className="text-sm" />
                        </button>
                      ))}
                    {onToggleStatus &&
                      (canReorder ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStatus(category);
                          }}
                          className="p-2 bg-orange-50 text-orange-600 rounded-lg transition-colors hover:bg-orange-100"
                          title={
                            category.status === "active"
                              ? "Deactivate Category"
                              : "Activate Category"
                          }
                        >
                          <FaPowerOff className="text-sm" />
                        </button>
                      ) : (
                        <button
                          disabled
                          title={getPermissionMessage("reorder", role)}
                          className="p-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                        >
                          <FaLock className="text-sm" />
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PracticeCategoryTable;
