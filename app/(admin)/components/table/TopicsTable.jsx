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

const TopicsTable = ({
  topics,
  onEdit,
  onDelete,
  onDragEnd,
  onToggleStatus,
}) => {
  const { canEdit, canDelete, canReorder, role } = usePermissions();
  const [draggedIndex, setDraggedIndex] = useState(null);
  const router = useRouter();

  const handleTopicClick = (topicId) => {
    router.push(`/admin/topic/${topicId}`);
  };

  if (!topics || topics.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="text-gray-400 text-6xl mb-4">📚</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Topics Found
        </h3>
        <p className="text-sm text-gray-500">Create your first topic to get started.</p>
      </div>
    );
  }

  // Group topics by Exam → Subject → Unit → Chapter
  const groupedTopics = useMemo(() => {
    const groups = {};
    topics.forEach((topic) => {
      const examId = topic.examId?._id || topic.examId || "unassigned";
      const examName = topic.examId?.name || "Unassigned";
      const subjectId = topic.subjectId?._id || topic.subjectId || "unassigned";
      const subjectName = topic.subjectId?.name || "Unassigned";
      const unitId = topic.unitId?._id || topic.unitId || "unassigned";
      const unitName = topic.unitId?.name || "Unassigned";
      const chapterId = topic.chapterId?._id || topic.chapterId || "unassigned";
      const chapterName = topic.chapterId?.name || "Unassigned";
      const groupKey = `${examId}-${subjectId}-${unitId}-${chapterId}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          examId,
          examName,
          subjectId,
          subjectName,
          unitId,
          unitName,
          chapterId,
          chapterName,
          topics: [],
        };
      }
      groups[groupKey].topics.push(topic);
    });

    // Sort by exam name, then subject name, then unit name, then chapter name
    return Object.values(groups).sort((a, b) => {
      if (a.examName !== b.examName) {
        return a.examName.localeCompare(b.examName);
      }
      if (a.subjectName !== b.subjectName) {
        return a.subjectName.localeCompare(b.subjectName);
      }
      if (a.unitName !== b.unitName) {
        return a.unitName.localeCompare(b.unitName);
      }
      return a.chapterName.localeCompare(b.chapterName);
    });
  }, [topics]);

  const handleDragStart = (e, groupIndex, topicIndex) => {
    setDraggedIndex(`${groupIndex}-${topicIndex}`);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e, groupIndex, topicIndex) => {
    e.preventDefault();
    const currentKey = `${groupIndex}-${topicIndex}`;
    if (!draggedIndex || draggedIndex === currentKey) return;

    const [sourceGroup, sourceIndex] = draggedIndex.split("-").map(Number);
    if (sourceGroup === groupIndex) {
      // Only allow drag within same group
      // Calculate new index in flat topics array
      let flatSourceIndex = 0;
      for (let i = 0; i < sourceGroup; i++) {
        flatSourceIndex += groupedTopics[i].topics.length;
      }
      flatSourceIndex += sourceIndex;

      let flatDestIndex = 0;
      for (let i = 0; i < groupIndex; i++) {
        flatDestIndex += groupedTopics[i].topics.length;
      }
      flatDestIndex += topicIndex;

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
      {groupedTopics.map((group, groupIndex) => {
        // Sort topics by orderNumber within each group
        const sortedTopics = [...group.topics].sort((a, b) => {
          const ao = a.orderNumber || Number.MAX_SAFE_INTEGER;
          const bo = b.orderNumber || Number.MAX_SAFE_INTEGER;
          return ao - bo;
        });

        return (
          <div
            key={`${group.examId}-${group.subjectId}-${group.unitId}-${group.chapterId}`}
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
                <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#7C3AED' }}>
                  {group.chapterName}
                </span>
                <span className="text-gray-400">›</span>
                <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#374151' }}>
                  {sortedTopics.length}{" "}
                  {sortedTopics.length === 1 ? "Topic" : "Topics"}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic Name</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedTopics.map((topic, topicIndex) => {
                    const dragKey = `${groupIndex}-${topicIndex}`;
                    return (
                      <tr
                        key={topic._id || topicIndex}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, groupIndex, topicIndex)
                        }
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, groupIndex, topicIndex)}
                        onDragEnd={() => setDraggedIndex(null)}
                        className={`hover:bg-gray-50 transition-colors cursor-move ${
                          draggedIndex === dragKey ? "opacity-50 bg-gray-100" : ""
                        } ${
                          topic.status === "inactive" 
                            ? "opacity-60" 
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-gray-400">
                          <FaGripVertical className="cursor-grab hover:text-gray-600 transition-colors" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-medium text-sm">
                            {topic.orderNumber || topicIndex + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            onClick={() => handleTopicClick(topic._id)}
                            className={`cursor-pointer text-sm font-medium hover:text-blue-600 transition-colors ${
                              topic.status === "inactive"
                                ? "text-gray-500 line-through"
                                : "text-gray-900"
                            }`}
                            title={topic.name}
                          >
                            {topic.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTopicClick(topic._id);
                              }}
                              className="p-2 bg-green-50 text-green-600 rounded-lg transition-colors hover:bg-green-100"
                              title="View Topic Details"
                            >
                              <FaEye className="text-sm" />
                            </button>
                            {onEdit && (
                              canEdit ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(topic);
                                  }}
                                  className="p-2 bg-blue-50 text-blue-600 rounded-lg transition-colors hover:bg-blue-100"
                                  title="Edit Topic"
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
                                onDelete(topic);
                              }}
                              className="p-2 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100"
                              title="Delete Topic"
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
                                onToggleStatus(topic);
                              }}
                              className="p-2 bg-orange-50 text-orange-600 rounded-lg transition-colors hover:bg-orange-100"
                              title={
                                topic.status === "active"
                                  ? "Deactivate Topic"
                                  : "Activate Topic"
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
              {sortedTopics.map((topic, topicIndex) => {
                const dragKey = `${groupIndex}-${topicIndex}`;
                return (
                  <div
                    key={topic._id || topicIndex}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      topic.status === "inactive" 
                        ? "opacity-60" 
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3
                          onClick={() => handleTopicClick(topic._id)}
                          className={`text-base font-semibold mb-2 cursor-pointer hover:text-blue-600 transition-colors ${
                            topic.status === "inactive"
                              ? "text-gray-500 line-through"
                              : "text-gray-900"
                          }`}
                          title={topic.name}
                        >
                          {topic.name}
                        </h3>
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium text-xs">
                          #{topic.orderNumber || topicIndex + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTopicClick(topic._id);
                          }}
                          className="p-2 bg-green-50 text-green-600 rounded-lg transition-colors hover:bg-green-100"
                          title="View Topic Details"
                        >
                          <FaEye className="text-sm" />
                        </button>
                        {onEdit && (
                          canEdit ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(topic);
                              }}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg transition-colors hover:bg-blue-100"
                              title="Edit Topic"
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
                                onDelete(topic);
                              }}
                              className="p-2 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100"
                              title="Delete Topic"
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
                                onToggleStatus(topic);
                              }}
                              className="p-2 bg-orange-50 text-orange-600 rounded-lg transition-colors hover:bg-orange-100"
                              title={
                                topic.status === "active"
                                  ? "Deactivate Topic"
                                  : "Activate Topic"
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

export default TopicsTable;

