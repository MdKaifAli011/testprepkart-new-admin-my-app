"use client";
import React, { useState, useMemo } from "react";
import {
  FaEdit,
  FaTrash,
  FaGripVertical,
  FaEye,
  FaPowerOff,
  FaLock,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { usePermissions, getPermissionMessage } from "../../hooks/usePermissions";

const ChaptersTable = ({
  chapters,
  onEdit,
  onDelete,
  onDragEnd,
  onToggleStatus,
}) => {
  const { canEdit, canDelete, canReorder, role } = usePermissions();
  const [draggedIndex, setDraggedIndex] = useState(null);
  const router = useRouter();

  const handleChapterClick = (chapterId) => {
    router.push(`/admin/chapter/${chapterId}`);
  };

  if (!chapters || chapters.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="text-6xl mb-4">📘</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Chapters Found
        </h3>
        <p className="text-sm text-gray-500">
          Add your first chapter to get started.
        </p>
      </div>
    );
  }

  // Group chapters by Exam → Subject → Unit
  const groupedChapters = useMemo(() => {
    const groups = {};
    chapters.forEach((chapter) => {
      const examId = chapter.examId?._id || chapter.examId || "unassigned";
      const examName = chapter.examId?.name || "Unassigned";
      const subjectId =
        chapter.subjectId?._id || chapter.subjectId || "unassigned";
      const subjectName = chapter.subjectId?.name || "Unassigned";
      const unitId = chapter.unitId?._id || chapter.unitId || "unassigned";
      const unitName = chapter.unitId?.name || "Unassigned";
      const groupKey = `${examId}-${subjectId}-${unitId}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          examId,
          examName,
          subjectId,
          subjectName,
          unitId,
          unitName,
          chapters: [],
        };
      }
      groups[groupKey].chapters.push(chapter);
    });

    // Sort by exam name, then subject name, then unit name
    return Object.values(groups).sort((a, b) => {
      if (a.examName !== b.examName) {
        return a.examName.localeCompare(b.examName);
      }
      if (a.subjectName !== b.subjectName) {
        return a.subjectName.localeCompare(b.subjectName);
      }
      return a.unitName.localeCompare(b.unitName);
    });
  }, [chapters]);

  const handleDragStart = (e, groupIndex, chapterIndex) => {
    setDraggedIndex(`${groupIndex}-${chapterIndex}`);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e, groupIndex, chapterIndex) => {
    e.preventDefault();
    const currentKey = `${groupIndex}-${chapterIndex}`;
    if (!draggedIndex || draggedIndex === currentKey) return;

    const [sourceGroup, sourceIndex] = draggedIndex.split("-").map(Number);
    if (sourceGroup === groupIndex) {
      // Only allow drag within same group
      // Calculate new index in flat chapters array
      let flatSourceIndex = 0;
      for (let i = 0; i < sourceGroup; i++) {
        flatSourceIndex += groupedChapters[i].chapters.length;
      }
      flatSourceIndex += sourceIndex;

      let flatDestIndex = 0;
      for (let i = 0; i < groupIndex; i++) {
        flatDestIndex += groupedChapters[i].chapters.length;
      }
      flatDestIndex += chapterIndex;

      onDragEnd &&
        onDragEnd({
          source: { index: flatSourceIndex },
          destination: { index: flatDestIndex },
        });
    }
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
      {groupedChapters.map((group, groupIndex) => {
        // Sort chapters by orderNumber within each group
        const sortedChapters = [...group.chapters].sort((a, b) => {
          const ao = a.orderNumber || Number.MAX_SAFE_INTEGER;
          const bo = b.orderNumber || Number.MAX_SAFE_INTEGER;
          return ao - bo;
        });

        return (
          <div
            key={`${group.examId}-${group.subjectId}-${group.unitId}`}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
            style={{ animationDelay: `${groupIndex * 0.1}s` }}
          >
            {/* Breadcrumb Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2.5 flex-wrap text-sm font-medium text-white">
                <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#10B981' }}>
                  {group.examName}
                </span>
                <span className="text-gray-400">›</span>
                <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#9333EA' }}>
                  {group.subjectName}
                </span>
                <span className="text-gray-400">›</span>
                <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#0056FF' }}>
                  {group.unitName}
                </span>
                <span className="text-gray-400">›</span>
                <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#374151' }}>
                  {sortedChapters.length}{" "}
                  {sortedChapters.length === 1 ? "Chapter" : "Chapters"}
                </span>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 w-10"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chapter Name</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Weightage</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Time (min)</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedChapters.map((chapter, chapterIndex) => {
                    const dragKey = `${groupIndex}-${chapterIndex}`;
                    return (
                      <tr
                        key={chapter._id || chapterIndex}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, groupIndex, chapterIndex)
                        }
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, groupIndex, chapterIndex)}
                        onDragEnd={() => setDraggedIndex(null)}
                        className={`hover:bg-gray-50 transition-colors cursor-move ${
                          draggedIndex === dragKey ? "opacity-50 bg-gray-100" : ""
                        } ${
                          chapter.status === "inactive"
                            ? "opacity-60"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-gray-400">
                          <FaGripVertical className="cursor-grab hover:text-gray-600 transition-colors" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-medium text-sm">
                            {chapter.orderNumber || chapterIndex + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            onClick={() => handleChapterClick(chapter._id)}
                            className={`cursor-pointer text-sm font-medium hover:text-blue-600 transition-colors ${
                              chapter.status === "inactive"
                                ? "text-gray-500 line-through"
                                : "text-gray-900"
                            }`}
                            title={chapter.name}
                          >
                            {chapter.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {chapter.weightage && chapter.weightage > 0 ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium text-sm">
                              {chapter.weightage}%
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium text-sm">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {chapter.time && chapter.time > 0 ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium text-sm">
                              {chapter.time}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {chapter.questions && chapter.questions > 0 ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium text-sm">
                              {chapter.questions}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleChapterClick(chapter._id)}
                              className="p-2 bg-green-50 text-green-600 rounded-lg transition-colors hover:bg-green-100"
                              title="View Chapter Details"
                            >
                              <FaEye className="text-sm" />
                            </button>
                            {canEdit ? (
                              <button
                                onClick={() => onEdit?.(chapter)}
                                className="p-2 bg-blue-50 text-blue-600 rounded-lg transition-colors hover:bg-blue-100"
                                title="Edit Chapter"
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
                            )}
                            {canDelete ? (
                              <button
                                onClick={() => onDelete?.(chapter)}
                                className="p-2 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100"
                                title="Delete Chapter"
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
                            )}
                            {onToggleStatus && (
                              canReorder ? (
                                <button
                                  onClick={() => onToggleStatus?.(chapter)}
                                  className="p-2 bg-orange-50 text-orange-600 rounded-lg transition-colors hover:bg-orange-100"
                                  title={
                                    chapter.status === "active"
                                      ? "Deactivate Chapter"
                                      : "Activate Chapter"
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet View */}
            <div className="lg:hidden divide-y divide-gray-200">
              {sortedChapters.map((chapter, chapterIndex) => {
                const dragKey = `${groupIndex}-${chapterIndex}`;
                return (
                  <div
                    key={chapter._id || chapterIndex}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      chapter.status === "inactive"
                        ? "opacity-60"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3
                          onClick={() => handleChapterClick(chapter._id)}
                          className={`text-base font-semibold mb-2 cursor-pointer hover:text-blue-600 transition-colors ${
                            chapter.status === "inactive"
                              ? "text-gray-500 line-through"
                              : "text-gray-900"
                          }`}
                          title={chapter.name}
                        >
                          {chapter.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium text-xs">
                            #{chapter.orderNumber || chapterIndex + 1}
                          </span>
                          {chapter.weightage && chapter.weightage > 0 && (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium text-xs">
                              {chapter.weightage}%
                            </span>
                          )}
                          {chapter.time && chapter.time > 0 && (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium text-xs">
                              {chapter.time}m
                            </span>
                          )}
                          {chapter.questions && chapter.questions > 0 && (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium text-xs">
                              {chapter.questions}Q
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleChapterClick(chapter._id)}
                          className="p-2 bg-green-50 text-green-600 rounded-lg transition-colors hover:bg-green-100"
                          title="View Chapter Details"
                        >
                          <FaEye className="text-sm" />
                        </button>
                        {canEdit ? (
                          <button
                            onClick={() => onEdit?.(chapter)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg transition-colors hover:bg-blue-100"
                            title="Edit Chapter"
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
                        )}
                        {canDelete ? (
                          <button
                            onClick={() => onDelete?.(chapter)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100"
                            title="Delete Chapter"
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
                        )}
                        {onToggleStatus && (
                          canReorder ? (
                            <button
                              onClick={() => onToggleStatus?.(chapter)}
                              className="p-2 bg-orange-50 text-orange-600 rounded-lg transition-colors hover:bg-orange-100"
                              title={
                                chapter.status === "active"
                                  ? "Deactivate Chapter"
                                  : "Activate Chapter"
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
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChaptersTable;
