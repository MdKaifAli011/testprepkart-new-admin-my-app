"use client";
import React from "react";
import { useRouter } from "next/navigation";
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaClipboardList,
  FaPowerOff,
  FaLock,
} from "react-icons/fa";
import { usePermissions, getPermissionMessage } from "../../hooks/usePermissions";

const ExamTable = ({ exams, onEdit, onDelete, onView, onToggleStatus }) => {
  const { canEdit, canDelete, canReorder, role } = usePermissions();
  const router = useRouter();

  const handleExamClick = (exam) => {
    router.push(`/admin/exam/${exam._id}`);
  };
  if (!exams || exams.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
        <div className="text-6xl mb-4 animate-float">📝</div>
        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
          No Exams Found
        </h3>
        <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto">
          Create your first exam to get started with organizing your assessments
          and tracking performance.
        </p>
        <div className="mt-6">
          <div className="inline-flex items-center gap-2 text-blue-600 text-xs font-medium">
            <FaClipboardList className="w-4 h-4" />
            <span>Ready to create your first exam?</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exam Details
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exams.map((exam, index) => (
              <tr
                key={exam._id || exam.id || index}
                className={`hover:bg-gray-50 transition-colors ${
                  exam.status === "inactive" ? "opacity-60" : ""
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <span
                      onClick={() => handleExamClick(exam)}
                      className={`text-sm font-medium truncate cursor-pointer hover:text-blue-600 transition-colors ${
                        exam.status === "inactive"
                          ? "text-gray-500 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {exam.name}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        exam.status === "active"
                          ? "bg-green-100 text-green-800"
                          : exam.status === "inactive"
                          ? "bg-red-100 text-red-800"
                          : exam.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {(exam.status || "active").charAt(0).toUpperCase() +
                        (exam.status || "active").slice(1)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleExamClick(exam)}
                      className="p-2 bg-green-50 text-green-600 rounded-lg transition-colors hover:bg-green-100"
                      title="View Exam Details"
                    >
                      <FaEye className="text-sm" />
                    </button>
                    {onEdit && (
                      canEdit ? (
                        <button
                          onClick={() => onEdit(exam)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg transition-colors hover:bg-blue-100"
                          title="Edit Exam"
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
                      )
                    )}
                    {onDelete && (
                      canDelete ? (
                        <button
                          onClick={() => onDelete(exam)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100"
                          title="Delete Exam"
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
                      )
                    )}
                    {onToggleStatus && (
                      canReorder ? (
                        <button
                          onClick={() => onToggleStatus(exam)}
                          className="p-2 bg-orange-50 text-orange-600 rounded-lg transition-colors hover:bg-orange-100"
                          title={
                            exam.status === "active"
                              ? "Deactivate Exam"
                              : "Activate Exam"
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
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200">
        {exams.map((exam, index) => (
          <div
            key={exam._id || exam.id || index}
            className={`p-4 hover:bg-gray-50 transition-colors ${
              exam.status === "inactive" ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3
                  onClick={() => handleExamClick(exam)}
                  className={`text-base font-semibold mb-2 cursor-pointer hover:text-blue-600 transition-colors ${
                    exam.status === "inactive"
                      ? "text-gray-500 line-through"
                      : "text-gray-900"
                  }`}
                >
                  {exam.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      exam.status === "active"
                        ? "bg-green-100 text-green-800"
                        : exam.status === "inactive"
                        ? "bg-red-100 text-red-800"
                        : exam.status === "draft"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {(exam.status || "active").charAt(0).toUpperCase() +
                      (exam.status || "active").slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleExamClick(exam)}
                  className="p-2 bg-green-50 text-green-600 rounded-lg transition-colors hover:bg-green-100"
                  title="View Exam Details"
                >
                  <FaEye className="text-sm" />
                </button>
                {onEdit && (
                  canEdit ? (
                    <button
                      onClick={() => onEdit(exam)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg transition-colors hover:bg-blue-100"
                      title="Edit Exam"
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
                  )
                )}
                {onDelete && (
                  canDelete ? (
                    <button
                      onClick={() => onDelete(exam)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100"
                      title="Delete Exam"
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
                  )
                )}
                {onToggleStatus && (
                  canReorder ? (
                    <button
                      onClick={() => onToggleStatus(exam)}
                      className="p-2 bg-orange-50 text-orange-600 rounded-lg transition-colors hover:bg-orange-100"
                      title={
                        exam.status === "active"
                          ? "Deactivate Exam"
                          : "Activate Exam"
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
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamTable;
