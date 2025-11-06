"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FaEdit,
  FaTrash,
  FaGripVertical,
  FaEye,
  FaPowerOff,
  FaLock,
} from "react-icons/fa";
import { FiTrash } from "react-icons/fi";
import { usePermissions, getPermissionMessage } from "../../hooks/usePermissions";

const UnitsTable = ({ units, onEdit, onDelete, onDragEnd, onToggleStatus }) => {
  const { canEdit, canDelete, canReorder, role } = usePermissions();
  const [draggedIndex, setDraggedIndex] = useState(null);
  const router = useRouter();

  const handleUnitClick = (unit) => {
    router.push(`/admin/unit/${unit._id}`);
  };

  if (!units || units.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="text-6xl mb-4">📘</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Units Found
        </h3>
        <p className="text-sm text-gray-500">
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
            className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
          >
            {/* Breadcrumb Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2.5 flex-wrap text-sm font-medium text-white">
                {/* Exam */}
                <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#10B981' }}>
                  {group.examName}
                </span>
                <span className="text-gray-400">›</span>
                {/* Subject */}
                <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#9333EA' }}>
                  {group.subjectName}
                </span>
                <span className="text-gray-400">›</span>
                {/* Units */}
                <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#6B7280' }}>
                  {sortedUnits.length}{" "}
                  {sortedUnits.length === 1 ? "Unit" : "Units"}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Name</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
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
                        className={`hover:bg-gray-50 transition-colors cursor-move ${
                          draggedIndex === dragKey ? "opacity-50 bg-gray-100" : ""
                        } ${
                          unit.status === "inactive" 
                            ? "opacity-60" 
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-gray-400">
                          <FaGripVertical className="cursor-grab hover:text-gray-600 transition-colors" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-medium text-sm">
                            {unit.orderNumber || unitIndex + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            onClick={() => handleUnitClick(unit)}
                            className={`cursor-pointer text-sm font-medium hover:text-blue-600 transition-colors ${
                              unit.status === "inactive"
                                ? "text-gray-500 line-through"
                                : "text-gray-900"
                            }`}
                            title={unit.name}
                          >
                            {unit.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnitClick(unit);
                              }}
                              className="p-2 bg-green-50 text-green-600 rounded-lg transition-colors hover:bg-green-100"
                              title="View Unit Details"
                            >
                              <FaEye className="text-sm" />
                            </button>
                            {canEdit ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(unit);
                                }}
                                className="p-2 bg-blue-50 text-blue-600 rounded-lg transition-colors hover:bg-blue-100"
                                title="Edit Unit"
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(unit);
                                }}
                                className="p-2 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100"
                                title="Delete Unit"
                              >
                                <FiTrash className="text-sm" />
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleStatus(unit);
                                  }}
                                  className="p-2 bg-orange-50 text-orange-600 rounded-lg transition-colors hover:bg-orange-100"
                                  title={
                                    unit.status === "active"
                                      ? "Deactivate Unit"
                                      : "Activate Unit"
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
              {sortedUnits.map((unit, unitIndex) => {
                const dragKey = `${groupIndex}-${unitIndex}`;
                return (
                  <div
                    key={unit._id || unitIndex}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      unit.status === "inactive" 
                        ? "opacity-60" 
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3
                          onClick={() => handleUnitClick(unit)}
                          className={`text-base font-semibold mb-2 cursor-pointer hover:text-blue-600 transition-colors ${
                            unit.status === "inactive"
                              ? "text-gray-500 line-through"
                              : "text-gray-900"
                          }`}
                          title={unit.name}
                        >
                          {unit.name}
                        </h3>
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium text-xs">
                          #{unit.orderNumber || unitIndex + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnitClick(unit);
                          }}
                          className="p-2 bg-green-50 text-green-600 rounded-lg transition-colors hover:bg-green-100"
                          title="View Unit Details"
                        >
                          <FaEye className="text-sm" />
                        </button>
                        {canEdit ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(unit);
                            }}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg transition-colors hover:bg-blue-100"
                            title="Edit Unit"
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
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(unit);
                            }}
                            className="p-2 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100"
                            title="Delete Unit"
                          >
                            <FiTrash className="text-sm" />
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
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleStatus(unit);
                              }}
                              className="p-2 bg-orange-50 text-orange-600 rounded-lg transition-colors hover:bg-orange-100"
                              title={
                                unit.status === "active"
                                  ? "Deactivate Unit"
                                  : "Activate Unit"
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

export default UnitsTable;

