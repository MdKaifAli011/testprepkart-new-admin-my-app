"use client";
import React, { useState, useMemo } from "react";
import {
  FaEdit,
  FaTrash,
  FaGripVertical,
  FaEye,
  FaPowerOff,
} from "react-icons/fa";
import { useRouter } from "next/navigation";

const ChaptersTable = ({
  chapters,
  onEdit,
  onDelete,
  onDragEnd,
  onToggleStatus,
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const router = useRouter();

  const handleChapterClick = (chapterId) => {
    router.push(`/admin/chapter/${chapterId}`);
  };

  if (!chapters || chapters.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-md">
        <div className="text-6xl mb-4">📘</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          No Chapters Found
        </h3>
        <p className="text-gray-500 text-sm">
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
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fadeIn"
            style={{ animationDelay: `${groupIndex * 0.1}s` }}
          >
            {/* 💎 Consistent Compact Breadcrumb Header */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-5 py-4 rounded-t-xl border-b-2 border-blue-200 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 flex-wrap text-sm font-semibold text-gray-700">
                  {/* Exam */}
                  <span className="px-4 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-md hover:from-green-600 hover:to-green-700 transition-all duration-200 hover:scale-105">
                    {group.examName}
                  </span>
                  <span className="text-gray-400 font-bold select-none text-lg">›</span>

                  {/* Subject */}
                  <span className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full shadow-md hover:from-purple-600 hover:to-purple-700 transition-all duration-200 hover:scale-105">
                    {group.subjectName}
                  </span>
                  <span className="text-gray-400 font-bold select-none text-lg">›</span>

                  {/* Unit */}
                  <span className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-105">
                    {group.unitName}
                  </span>
                  <span className="text-gray-400 font-bold select-none text-lg">›</span>

                  {/* Chapters */}
                  <span className="px-4 py-1.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full shadow-md hover:from-gray-600 hover:to-gray-700 transition-all duration-200 hover:scale-105">
                    {sortedChapters.length}{" "}
                    {sortedChapters.length === 1 ? "Chapter" : "Chapters"}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3.5 w-10"></th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 w-20">Order</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 min-w-[250px]">Chapter Name</th>
                    <th className="px-4 py-3.5 text-center font-semibold text-gray-700 w-32">Weightage</th>
                    <th className="px-4 py-3.5 text-center font-semibold text-gray-700 w-28">Time (min)</th>
                    <th className="px-4 py-3.5 text-center font-semibold text-gray-700 w-28">Questions</th>
                    <th className="px-4 py-3.5 text-right font-semibold text-gray-700 w-40">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
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
                        className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-move border-b border-gray-100 ${
                          draggedIndex === dragKey ? "opacity-50 bg-gray-100" : ""
                        } ${
                          chapter.status === "inactive"
                            ? "opacity-60 bg-gray-50"
                            : "bg-white"
                        }`}
                      >
                        <td className="px-3 py-4 text-gray-400">
                          <FaGripVertical className="cursor-grab hover:text-gray-600 transition-colors" />
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-bold text-sm shadow-sm border border-blue-200">
                            {chapter.orderNumber || chapterIndex + 1}
                          </span>
                        </td>
                        <td className="px-4 py-4 min-w-[200px]">
                          <span
                            onClick={() => handleChapterClick(chapter._id)}
                            className={`cursor-pointer font-semibold text-base hover:text-blue-600 hover:underline transition-all duration-200 break-words whitespace-normal ${
                              chapter.status === "inactive"
                                ? "text-gray-500 line-through"
                                : "text-gray-900"
                            }`}
                            title={chapter.name}
                          >
                            {chapter.name}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {chapter.weightage && chapter.weightage > 0 ? (
                            <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm shadow-sm">
                              {chapter.weightage}%
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium text-sm">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {chapter.time && chapter.time > 0 ? (
                            <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-semibold text-sm shadow-sm">
                              {chapter.time}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium text-sm">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {chapter.questions && chapter.questions > 0 ? (
                            <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 font-semibold text-sm shadow-sm">
                              {chapter.questions}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium text-sm">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleChapterClick(chapter._id)}
                              className="p-2.5 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                              title="View Chapter Details"
                            >
                              <FaEye className="text-sm" />
                            </button>
                            <button
                              onClick={() => onEdit?.(chapter)}
                              className="p-2.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                              title="Edit Chapter"
                            >
                              <FaEdit className="text-sm" />
                            </button>
                            <button
                              onClick={() => onDelete?.(chapter)}
                              className="p-2.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                              title="Delete Chapter"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                            <button
                              onClick={() => onToggleStatus?.(chapter)}
                              className="p-2.5 rounded-lg text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                              title={
                                chapter.status === "active"
                                  ? "Deactivate Chapter"
                                  : "Activate Chapter"
                              }
                            >
                              <FaPowerOff className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet View */}
            <div className="lg:hidden divide-y divide-gray-100">
              {sortedChapters.map((chapter, chapterIndex) => {
                const dragKey = `${groupIndex}-${chapterIndex}`;
                return (
                  <div
                    key={chapter._id || chapterIndex}
                    className={`p-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-b border-gray-100 ${
                      chapter.status === "inactive"
                        ? "opacity-60 bg-gray-50"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3
                          onClick={() => handleChapterClick(chapter._id)}
                          className={`text-base font-bold mb-2 cursor-pointer hover:text-blue-600 hover:underline transition-all duration-200 break-words whitespace-normal leading-relaxed ${
                            chapter.status === "inactive"
                              ? "text-gray-500 line-through"
                              : "text-gray-900"
                          }`}
                          title={chapter.name}
                        >
                          {chapter.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-semibold text-xs shadow-sm border border-blue-200">
                            #{chapter.orderNumber || chapterIndex + 1}
                          </span>
                          {chapter.weightage && chapter.weightage > 0 ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs shadow-sm">
                              {chapter.weightage}%
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium text-xs">
                              —
                            </span>
                          )}
                          {chapter.time && chapter.time > 0 ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-xs shadow-sm">
                              {chapter.time}m
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium text-xs">
                              —
                            </span>
                          )}
                          {chapter.questions && chapter.questions > 0 ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold text-xs shadow-sm">
                              {chapter.questions}Q
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium text-xs">
                              —
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleChapterClick(chapter._id)}
                          className="p-2.5 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                          title="View Chapter Details"
                        >
                          <FaEye className="text-sm" />
                        </button>
                        <button
                          onClick={() => onEdit?.(chapter)}
                          className="p-2.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        <button
                          onClick={() => onDelete?.(chapter)}
                          className="p-2.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                        <button
                          onClick={() => onToggleStatus?.(chapter)}
                          className="p-2.5 rounded-lg text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                          title={
                            chapter.status === "active"
                              ? "Deactivate Chapter"
                              : "Activate Chapter"
                          }
                        >
                          <FaPowerOff className="text-sm" />
                        </button>
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
