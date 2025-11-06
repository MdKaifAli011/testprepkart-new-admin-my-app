import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { FaEdit, FaTrash, FaEye, FaPowerOff } from "react-icons/fa";

const SubjectTable = ({ subjects, onEdit, onDelete, onToggleStatus }) => {
  const router = useRouter();

  const handleSubjectClick = (subject) => {
    router.push(`/admin/subject/${subject._id}`);
  };

  if (!subjects || subjects.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-lg">
        <div className="text-gray-400 text-6xl mb-4">📘</div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
          No Subjects Found
        </h3>
        <p className="text-gray-500 text-xs">
          Add your first subject to get started.
        </p>
      </div>
    );
  }

  // Group subjects by Exam
  const groupedSubjects = useMemo(() => {
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

  return (
    <div className="space-y-6">
      {groupedSubjects.map((group, groupIndex) => (
        <div
          key={group.examId}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fadeIn"
          style={{ animationDelay: `${groupIndex * 0.1}s` }}
        >
          {/* 💎 Refined Compact Breadcrumb Header */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-5 py-4 rounded-t-xl border-b-2 border-blue-200 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 flex-wrap text-sm font-semibold text-gray-700">
                {/* Exam Name */}
                <span className="px-4 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-md hover:from-green-600 hover:to-green-700 transition-all duration-200 hover:scale-105">
                  {group.examName}
                </span>

                <span className="text-gray-400 font-bold select-none text-lg">›</span>

                {/* Subject Count */}
                <span className="px-4 py-1.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full shadow-md hover:from-gray-600 hover:to-gray-700 transition-all duration-200 hover:scale-105">
                  {group.subjects.length}{" "}
                  {group.subjects.length === 1 ? "Subject" : "Subjects"}
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-700 min-w-[300px]">
                    Subject Name
                  </th>
                  <th className="px-5 py-3.5 text-right font-semibold text-gray-700 w-40">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {group.subjects.map((subject, index) => (
                  <tr
                    key={subject._id || subject.id || index}
                    className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer border-b border-gray-100 ${
                      subject.status === "inactive" 
                        ? "opacity-60 bg-gray-50" 
                        : "bg-white"
                    }`}
                  >
                    <td
                      className={`px-5 py-4 font-semibold text-base hover:text-blue-600 hover:underline transition-all duration-200 break-words whitespace-normal leading-relaxed ${
                        subject.status === "inactive"
                          ? "text-gray-500 line-through"
                          : "text-gray-900"
                      }`}
                      onClick={() => handleSubjectClick(subject)}
                      title={subject.name}
                    >
                      {subject.name}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubjectClick(subject);
                          }}
                          className="p-2.5 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                          title="View Subject Details"
                        >
                          <FaEye className="text-sm" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit && onEdit(subject);
                          }}
                          className="p-2.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                          title="Edit Subject"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete && onDelete(subject);
                          }}
                          className="p-2.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                          title="Delete Subject"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStatus && onToggleStatus(subject);
                          }}
                          className="p-2.5 rounded-lg text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                          title={
                            subject.status === "active"
                              ? "Deactivate Subject"
                              : "Activate Subject"
                          }
                        >
                          <FaPowerOff className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tablet/Mobile View */}
          <div className="lg:hidden divide-y divide-gray-100">
            {group.subjects.map((subject, index) => (
              <div
                key={subject._id || subject.id || index}
                className={`p-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-b border-gray-100 ${
                  subject.status === "inactive" 
                    ? "opacity-60 bg-gray-50" 
                    : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex-1 min-w-0 pr-2 cursor-pointer hover:text-blue-600 transition-all duration-200"
                    onClick={() => handleSubjectClick(subject)}
                  >
                    <h3 
                      className={`text-base font-bold mb-2 break-words whitespace-normal leading-relaxed ${
                        subject.status === "inactive" 
                          ? "text-gray-500 line-through" 
                          : "text-gray-900"
                      }`}
                      title={subject.name}
                    >
                      {subject.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm ${
                        subject.status === "inactive" 
                          ? "bg-red-500" 
                          : "bg-green-500"
                      }`}></div>
                      <span className="text-xs text-gray-500 font-medium">
                        {subject.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubjectClick(subject);
                      }}
                      className="p-2.5 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                      title="View Subject Details"
                    >
                      <FaEye className="text-sm" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit && onEdit(subject);
                      }}
                      className="p-2.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                      title="Edit Subject"
                    >
                      <FaEdit className="text-sm" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete && onDelete(subject);
                      }}
                      className="p-2.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                      title="Delete Subject"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus && onToggleStatus(subject);
                      }}
                      className="p-2.5 rounded-lg text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                      title={
                        subject.status === "active"
                          ? "Deactivate Subject"
                          : "Activate Subject"
                      }
                    >
                      <FaPowerOff className="text-sm" />
                    </button>
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

