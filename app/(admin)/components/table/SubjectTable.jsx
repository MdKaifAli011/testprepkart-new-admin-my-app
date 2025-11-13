"use client";
import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { FaEdit, FaTrash, FaEye, FaPowerOff, FaLock } from "react-icons/fa";
import { usePermissions, getPermissionMessage } from "../../hooks/usePermissions";

const SubjectTable = ({ subjects, onEdit, onDelete, onToggleStatus }) => {
  const { canEdit, canDelete, canReorder, role } = usePermissions();
  const router = useRouter();

  const handleSubjectClick = (subject) => {
    router.push(`/admin/subject/${subject._id}`);
  };

  // Group subjects by Exam
  const groupedSubjects = useMemo(() => {
    if (!subjects || subjects.length === 0) {
      return [];
    }
    const groups = {};
    subjects.forEach((subject) => {
      const examId = subject.examId?._id || subject.examId || "unassigned";
      const examName = subject.examId?.name || "Unassigned";
      if (!groups[examId]) {
        groups[examId] = {
          examId,
          examName,
          subjects: [],
        };
      }
      groups[examId].subjects.push(subject);
    });

    // Sort groups alphabetically by exam name
    return Object.values(groups).sort((a, b) =>
      a.examName.localeCompare(b.examName)
    );
  }, [subjects]);

  if (!subjects || subjects.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="text-gray-400 text-6xl mb-4">📘</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Subjects Found
        </h3>
        <p className="text-sm text-gray-500">
          Add your first subject to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedSubjects.map((group, groupIndex) => (
        <div
          key={group.examId}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
        >
          {/* Breadcrumb Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2.5 flex-wrap text-sm font-medium text-white">
              {/* Exam Name */}
              <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#10B981' }}>
                {group.examName}
              </span>
              <span className="text-gray-400">›</span>
              {/* Subject Count */}
              <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#6B7280' }}>
                {group.subjects.length}{" "}
                {group.subjects.length === 1 ? "Subject" : "Subjects"}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject Name
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {group.subjects.map((subject, index) => (
                  <tr
                    key={subject._id || subject.id || index}
                    className={`hover:bg-gray-50 transition-colors ${
                      subject.status === "inactive" 
                        ? "opacity-60" 
                        : ""
                    }`}
                  >
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors ${
                        subject.status === "inactive"
                          ? "text-gray-500 line-through"
                          : "text-gray-900"
                      }`}
                      onClick={() => handleSubjectClick(subject)}
                      title={subject.name}
                    >
                      {subject.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubjectClick(subject);
                          }}
                          className="p-2 bg-green-50 text-green-600 rounded-lg transition-colors hover:bg-green-100"
                          title="View Subject Details"
                        >
                          <FaEye className="text-sm" />
                        </button>
                        {onEdit && (
                          canEdit ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(subject);
                              }}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg transition-colors hover:bg-blue-100"
                              title="Edit Subject"
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
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(subject);
                              }}
                              className="p-2 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100"
                              title="Delete Subject"
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
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleStatus(subject);
                              }}
                              className="p-2 bg-orange-50 text-orange-600 rounded-lg transition-colors hover:bg-orange-100"
                              title={
                                subject.status === "active"
                                  ? "Deactivate Subject"
                                  : "Activate Subject"
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

          {/* Tablet/Mobile View */}
          <div className="lg:hidden divide-y divide-gray-200">
            {group.subjects.map((subject, index) => (
              <div
                key={subject._id || subject.id || index}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  subject.status === "inactive" 
                    ? "opacity-60" 
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex-1 min-w-0 pr-2 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSubjectClick(subject)}
                  >
                    <h3 
                      className={`text-base font-semibold mb-2 ${
                        subject.status === "inactive" 
                          ? "text-gray-500 line-through" 
                          : "text-gray-900"
                      }`}
                      title={subject.name}
                    >
                      {subject.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        subject.status === "active" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {subject.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubjectClick(subject);
                      }}
                      className="p-2 bg-green-50 text-green-600 rounded-lg transition-colors hover:bg-green-100"
                      title="View Subject Details"
                    >
                      <FaEye className="text-sm" />
                    </button>
                    {onEdit && (
                      canEdit ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(subject);
                          }}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg transition-colors hover:bg-blue-100"
                          title="Edit Subject"
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
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(subject);
                          }}
                          className="p-2 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100"
                          title="Delete Subject"
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
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStatus(subject);
                          }}
                          className="p-2 bg-orange-50 text-orange-600 rounded-lg transition-colors hover:bg-orange-100"
                          title={
                            subject.status === "active"
                              ? "Deactivate Subject"
                              : "Activate Subject"
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
      ))}
    </div>
  );
};

export default SubjectTable;

