"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { FaEdit, FaTrash, FaPowerOff, FaLock } from "react-icons/fa";
import {
  usePermissions,
  getPermissionMessage,
} from "../../hooks/usePermissions";

const PracticeSubCategoryTable = ({
  subCategories,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const { canEdit, canDelete, canReorder, role } = usePermissions();
  const router = useRouter();

  const handlePaperClick = (subCategory) => {
    router.push(
      `/admin/practice/subcategory/${subCategory._id || subCategory.id}`
    );
  };

  if (!subCategories || subCategories.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="text-gray-400 text-6xl mb-4">📄</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Papers Found
        </h3>
        <p className="text-sm text-gray-500">
          Add your first paper to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paper Name
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Max Marks
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Questions
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Negative Marks
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subCategories.map((subCategory, index) => (
              <tr
                key={subCategory._id || index}
                className={`hover:bg-gray-50 transition-colors ${
                  subCategory.status === "inactive" ? "opacity-60" : ""
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    onClick={() => handlePaperClick(subCategory)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
                  >
                    {subCategory.orderNumber
                      ? `${subCategory.orderNumber}. `
                      : ""}
                    {subCategory.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-sm text-gray-600">
                    {subCategory.duration || "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-sm font-medium text-gray-900">
                    {subCategory.maximumMarks || 0}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-sm font-medium text-gray-900">
                    {subCategory.numberOfQuestions || 0}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-sm text-gray-600">
                    {subCategory.negativeMarks || 0}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      subCategory.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {subCategory.status === "active" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onEdit &&
                      (canEdit ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(subCategory);
                          }}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg transition-colors hover:bg-blue-100"
                          title="Edit Paper"
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
                            onDelete(subCategory);
                          }}
                          className="p-2 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100"
                          title="Delete Paper"
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
                            onToggleStatus(subCategory);
                          }}
                          className="p-2 bg-orange-50 text-orange-600 rounded-lg transition-colors hover:bg-orange-100"
                          title={
                            subCategory.status === "active"
                              ? "Deactivate Paper"
                              : "Activate Paper"
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
        {subCategories.map((subCategory, index) => (
          <div
            key={subCategory._id || index}
            className={`p-4 hover:bg-gray-50 transition-colors ${
              subCategory.status === "inactive" ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3
                  onClick={() => handlePaperClick(subCategory)}
                  className={`text-base font-semibold mb-2 cursor-pointer transition-colors ${
                    subCategory.status === "inactive"
                      ? "text-gray-500 line-through"
                      : "text-blue-600 hover:text-blue-800"
                  }`}
                >
                  {subCategory.orderNumber
                    ? `${subCategory.orderNumber}. `
                    : ""}
                  {subCategory.name}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Duration:</span>{" "}
                    {subCategory.duration || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Max Marks:</span>{" "}
                    {subCategory.maximumMarks || 0}
                  </div>
                  <div>
                    <span className="font-medium">Questions:</span>{" "}
                    {subCategory.numberOfQuestions || 0}
                  </div>
                  <div>
                    <span className="font-medium">Negative Marks:</span>{" "}
                    {subCategory.negativeMarks || 0}
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium inline-block ${
                        subCategory.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {subCategory.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {onEdit &&
                  (canEdit ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(subCategory);
                      }}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg transition-colors hover:bg-blue-100"
                      title="Edit Paper"
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
                        onDelete(subCategory);
                      }}
                      className="p-2 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100"
                      title="Delete Paper"
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
                        onToggleStatus(subCategory);
                      }}
                      className="p-2 bg-orange-50 text-orange-600 rounded-lg transition-colors hover:bg-orange-100"
                      title={
                        subCategory.status === "active"
                          ? "Deactivate Paper"
                          : "Activate Paper"
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
  );
};

export default PracticeSubCategoryTable;
