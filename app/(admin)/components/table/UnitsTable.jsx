import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FaEdit,
  FaTrash,
  FaGripVertical,
  FaEye,
  FaPowerOff,
} from "react-icons/fa";
import { FiTrash } from "react-icons/fi";

const UnitsTable = ({ units, onEdit, onDelete, onDragEnd, onToggleStatus }) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const router = useRouter();

  const handleUnitClick = (unit) => {
    router.push(`/admin/unit/${unit._id}`);
  };

  if (!units || units.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-lg">
        <div className="text-6xl mb-4">📘</div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
          No Units Found
        </h3>
        <p className="text-gray-500 text-xs">
          Add your first unit to get started.
        </p>
      </div>
    );
  }

  // Group units by Exam → Subject
  const groupedUnits = useMemo(() => {
    const groups = {};
    units.forEach((unit) => {
      const examId = unit.examId?._id || unit.examId || "unassigned";
      const examName = unit.examId?.name || "Unassigned";
      const subjectId = unit.subjectId?._id || unit.subjectId || "unassigned";
      const subjectName = unit.subjectId?.name || "Unassigned";
      const groupKey = `${examId}-${subjectId}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          examId,
          examName,
          subjectId,
          subjectName,
          units: [],
        };
      }
      groups[groupKey].units.push(unit);
    });

    // Sort by exam name, then subject name
    return Object.values(groups).sort((a, b) => {
      if (a.examName !== b.examName) {
        return a.examName.localeCompare(b.examName);
      }
      return a.subjectName.localeCompare(b.subjectName);
    });
  }, [units]);

  const handleDragStart = (e, groupIndex, unitIndex) => {
    setDraggedIndex(`${groupIndex}-${unitIndex}`);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e, groupIndex, unitIndex) => {
    e.preventDefault();
    const currentKey = `${groupIndex}-${unitIndex}`;
    if (!draggedIndex || draggedIndex === currentKey) return;

    const [sourceGroup, sourceIndex] = draggedIndex.split("-").map(Number);
    if (sourceGroup === groupIndex) {
      // Only allow drag within same group
      const group = groupedUnits[sourceGroup];
      const sourceUnit = group.units[sourceIndex];

      // Calculate new index in flat units array
      let flatSourceIndex = 0;
      for (let i = 0; i < sourceGroup; i++) {
        flatSourceIndex += groupedUnits[i].units.length;
      }
      flatSourceIndex += sourceIndex;

      let flatDestIndex = 0;
      for (let i = 0; i < groupIndex; i++) {
        flatDestIndex += groupedUnits[i].units.length;
      }
      flatDestIndex += unitIndex;

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
      {groupedUnits.map((group, groupIndex) => {
        // Sort units by orderNumber within each group
        const sortedUnits = [...group.units].sort((a, b) => {
          const ao = a.orderNumber || Number.MAX_SAFE_INTEGER;
          const bo = b.orderNumber || Number.MAX_SAFE_INTEGER;
          return ao - bo;
        });

        return (
          <div
            key={`${group.examId}-${group.subjectId}`}
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fadeIn"
            style={{ animationDelay: `${groupIndex * 0.1}s` }}
          >
            {/* 🎯 Compact & Polished Breadcrumb Header */}
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

                  {/* Units */}
                  <span className="px-4 py-1.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full shadow-md hover:from-gray-600 hover:to-gray-700 transition-all duration-200 hover:scale-105">
                    {sortedUnits.length}{" "}
                    {sortedUnits.length === 1 ? "Unit" : "Units"}
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
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-700 min-w-[250px]">Unit Name</th>
                    <th className="px-4 py-3.5 text-right font-semibold text-gray-700 w-40">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {sortedUnits.map((unit, unitIndex) => {
                    const dragKey = `${groupIndex}-${unitIndex}`;
                    return (
                      <tr
                        key={unit._id || unitIndex}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, groupIndex, unitIndex)
                        }
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, groupIndex, unitIndex)}
                        onDragEnd={() => setDraggedIndex(null)}
                        className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-move border-b border-gray-100 ${
                          draggedIndex === dragKey ? "opacity-50 bg-gray-100" : ""
                        } ${
                          unit.status === "inactive" 
                            ? "opacity-60 bg-gray-50" 
                            : "bg-white"
                        }`}
                      >
                        <td className="px-3 py-4 text-gray-400">
                          <FaGripVertical className="cursor-grab hover:text-gray-600 transition-colors" />
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-bold text-sm shadow-sm border border-blue-200">
                            {unit.orderNumber || unitIndex + 1}
                          </span>
                        </td>
                        <td className="px-4 py-4 min-w-[200px]">
                          <span
                            onClick={() => handleUnitClick(unit)}
                            className={`cursor-pointer font-semibold text-base hover:text-blue-600 hover:underline transition-all duration-200 break-words whitespace-normal leading-relaxed ${
                              unit.status === "inactive"
                                ? "text-gray-500 line-through"
                                : "text-gray-900"
                            }`}
                            title={unit.name}
                          >
                            {unit.name}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnitClick(unit);
                              }}
                              className="p-2.5 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                              title="View Unit Details"
                            >
                              <FaEye className="text-sm" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(unit);
                              }}
                              className="p-2.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                              title="Edit Unit"
                            >
                              <FaEdit className="text-sm" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(unit);
                              }}
                              className="p-2.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                              title="Delete Unit"
                            >
                              <FiTrash className="text-sm" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleStatus && onToggleStatus(unit);
                              }}
                              className="p-2.5 rounded-lg text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                              title={
                                unit.status === "active"
                                  ? "Deactivate Unit"
                                  : "Activate Unit"
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
              {sortedUnits.map((unit, unitIndex) => {
                const dragKey = `${groupIndex}-${unitIndex}`;
                return (
                  <div
                    key={unit._id || unitIndex}
                    className={`p-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-b border-gray-100 ${
                      unit.status === "inactive" 
                        ? "opacity-60 bg-gray-50" 
                        : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3
                          onClick={() => handleUnitClick(unit)}
                          className={`text-base font-bold mb-2 cursor-pointer hover:text-blue-600 hover:underline transition-all duration-200 break-words whitespace-normal leading-relaxed ${
                            unit.status === "inactive"
                              ? "text-gray-500 line-through"
                              : "text-gray-900"
                          }`}
                          title={unit.name}
                        >
                          {unit.name}
                        </h3>
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-semibold text-xs shadow-sm border border-blue-200">
                          #{unit.orderNumber || unitIndex + 1}
                        </span>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnitClick(unit);
                          }}
                          className="p-2.5 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                          title="View Unit Details"
                        >
                          <FaEye className="text-sm" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(unit);
                          }}
                          className="p-2.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(unit);
                          }}
                          className="p-2.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                        >
                          <FiTrash className="text-sm" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStatus && onToggleStatus(unit);
                          }}
                          className="p-2.5 rounded-lg text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                          title={
                            unit.status === "active"
                              ? "Deactivate Unit"
                              : "Activate Unit"
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

export default UnitsTable;

