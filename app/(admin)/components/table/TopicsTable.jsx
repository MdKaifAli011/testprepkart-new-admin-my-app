import React, { useState, useMemo } from "react";
import {
  FaEdit,
  FaTrash,
  FaGripVertical,
  FaEye,
  FaPowerOff,
} from "react-icons/fa";
import { useRouter } from "next/navigation";

const TopicsTable = ({
  topics,
  onEdit,
  onDelete,
  onDragEnd,
  onToggleStatus,
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const router = useRouter();

  const handleTopicClick = (topicId) => {
    router.push(`/admin/topic/${topicId}`);
  };

  if (!topics || topics.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="text-gray-400 text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Topics Found
        </h3>
        <p className="text-gray-500">Create your first topic to get started.</p>
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

                  {/* Chapter */}
                  <span className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-full shadow-md hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 hover:scale-105">
                    {group.chapterName}
                  </span>
                  <span className="text-gray-400 font-bold select-none text-lg">›</span>

                  {/* Topics */}
                  <span className="px-4 py-1.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full shadow-md hover:from-gray-600 hover:to-gray-700 transition-all duration-200 hover:scale-105">
                    {sortedTopics.length}{" "}
                    {sortedTopics.length === 1 ? "Topic" : "Topics"}
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
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 min-w-[250px]">Topic Name</th>
                    <th className="px-4 py-3.5 text-right font-semibold text-gray-700 w-40">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
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
                        className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-move border-b border-gray-100 ${
                          draggedIndex === dragKey ? "opacity-50 bg-gray-100" : ""
                        } ${
                          topic.status === "inactive" 
                            ? "opacity-60 bg-gray-50" 
                            : "bg-white"
                        }`}
                      >
                        <td className="px-3 py-4 text-gray-400">
                          <FaGripVertical className="cursor-grab hover:text-gray-600 transition-colors" />
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-bold text-sm shadow-sm border border-blue-200">
                            {topic.orderNumber || topicIndex + 1}
                          </span>
                        </td>
                        <td className="px-4 py-4 min-w-[200px]">
                          <span
                            onClick={() => handleTopicClick(topic._id)}
                            className={`cursor-pointer font-semibold text-base hover:text-blue-600 hover:underline transition-all duration-200 break-words whitespace-normal leading-relaxed ${
                              topic.status === "inactive"
                                ? "text-gray-500 line-through"
                                : "text-gray-900"
                            }`}
                            title={topic.name}
                          >
                            {topic.name}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTopicClick(topic._id);
                              }}
                              className="p-2.5 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                              title="View Topic Details"
                            >
                              <FaEye className="text-sm" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit && onEdit(topic);
                              }}
                              className="p-2.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                              title="Edit Topic"
                            >
                              <FaEdit className="text-sm" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete && onDelete(topic);
                              }}
                              className="p-2.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                              title="Delete Topic"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleStatus && onToggleStatus(topic);
                              }}
                              className="p-2.5 rounded-lg text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                              title={
                                topic.status === "active"
                                  ? "Deactivate Topic"
                                  : "Activate Topic"
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
              {sortedTopics.map((topic, topicIndex) => {
                const dragKey = `${groupIndex}-${topicIndex}`;
                return (
                  <div
                    key={topic._id || topicIndex}
                    className={`p-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-b border-gray-100 ${
                      topic.status === "inactive" 
                        ? "opacity-60 bg-gray-50" 
                        : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3
                          onClick={() => handleTopicClick(topic._id)}
                          className={`text-base font-bold mb-2 cursor-pointer hover:text-blue-600 hover:underline transition-all duration-200 break-words whitespace-normal leading-relaxed ${
                            topic.status === "inactive"
                              ? "text-gray-500 line-through"
                              : "text-gray-900"
                          }`}
                          title={topic.name}
                        >
                          {topic.name}
                        </h3>
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-semibold text-xs shadow-sm border border-blue-200">
                          #{topic.orderNumber || topicIndex + 1}
                        </span>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTopicClick(topic._id);
                          }}
                          className="p-2.5 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                          title="View Topic Details"
                        >
                          <FaEye className="text-sm" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit && onEdit(topic);
                          }}
                          className="p-2.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete && onDelete(topic);
                          }}
                          className="p-2.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStatus && onToggleStatus(topic);
                          }}
                          className="p-2.5 rounded-lg text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                          title={
                            topic.status === "active"
                              ? "Deactivate Topic"
                              : "Activate Topic"
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

export default TopicsTable;

