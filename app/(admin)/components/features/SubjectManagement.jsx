"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import SubjectTable from "../table/SubjectTable";
import {
  LoadingWrapper,
  SkeletonPageContent,
  LoadingSpinner,
} from "../ui/SkeletonLoader";
import {
  FaPlus,
  FaTimes,
  FaSave,
  FaExclamationTriangle,
  FaClipboardList,
  FaFilter,
} from "react-icons/fa";
import { ToastContainer, useToast } from "../ui/Toast";
import api from "@/lib/api";

const SubjectManagement = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    examId: "",
  });
  const [formError, setFormError] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterExam, setFilterExam] = useState("");
  const { toasts, removeToast, success, error: showError } = useToast();
  const isFetchingRef = useRef(false);

  // ✅ Fetch Subjects using Axios
  const fetchSubjects = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      setIsDataLoading(true);
      setError(null);
      // Fetch all subjects (active and inactive) to show correct status
      const response = await api.get("/subject?status=all");

      if (response.data?.success) {
        setSubjects(response.data.data || []);
      } else {
        setError(response.data?.message || "Failed to fetch subjects");
      }
    } catch (err) {
      console.error("❌ Error fetching subjects:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch subjects";
      setError(errorMessage);
    } finally {
      setIsDataLoading(false);
      isFetchingRef.current = false;
    }
  };

  // ✅ Fetch Exams (for dropdown) using Axios
  const fetchExams = async () => {
    try {
      // Fetch all exams (active and inactive) for dropdown
      const response = await api.get("/exam?status=all");

      if (response.data?.success) {
        setExams(response.data.data || []);
      } else {
        console.error("Failed to fetch exams:", response.data?.message);
      }
    } catch (err) {
      console.error("❌ Error fetching exams:", err);
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchExams();
  }, []);

  // Filter subjects based on selected exam
  const filteredSubjects = useMemo(() => {
    if (!filterExam) return subjects;
    return subjects.filter(
      (subject) =>
        subject.examId?._id === filterExam || subject.examId === filterExam
    );
  }, [subjects, filterExam]);

  // Get active filter count
  const activeFilterCount = filterExam ? 1 : 0;

  // Clear all filters
  const clearFilters = () => {
    setFilterExam("");
  };

  // ✅ Handle Input Change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError(null);
  };

  // ✅ Handle Add Subject using Axios
  const handleAddSubject = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.examId) {
      setFormError("Please fill in all required fields.");
      return;
    }

    try {
      setIsFormLoading(true);
      setFormError(null);
      const response = await api.post("/subject", formData);

      if (response.data?.success) {
        // Add the new subject with populated exam data
        setSubjects((prev) => [...prev, response.data.data]);
        success(`Subject "${formData.name}" added successfully!`);
        // Reset form
        setFormData({ name: "", examId: "" });
        setShowAddForm(false);
      } else {
        setFormError(response.data?.message || "Failed to add subject");
        showError(response.data?.message || "Failed to add subject");
      }
    } catch (err) {
      console.error("❌ Error adding subject:", err);
      const errorMessage =
        err?.response?.data?.message || err?.message || "Failed to add subject";
      setFormError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleCancelForm = () => {
    setFormData({ name: "", examId: "" });
    setFormError(null);
    setShowAddForm(false);
  };

  // ✅ Handle Edit Subject
  const handleEditSubject = async (subjectToEdit) => {
    const newName = prompt("Enter new subject name:", subjectToEdit.name);
    if (newName && newName.trim() !== subjectToEdit.name) {
      try {
        setIsFormLoading(true);
        setError(null);

        const response = await api.put(`/subject/${subjectToEdit._id}`, {
          name: newName.trim(),
          examId: subjectToEdit.examId._id || subjectToEdit.examId,
        });

        if (response.data?.success) {
          setSubjects((prev) =>
            prev.map((s) =>
              s._id === subjectToEdit._id ? response.data.data : s
            )
          );
          success("Subject updated successfully!");
        } else {
          setError(response.data?.message || "Failed to update subject");
          showError(response.data?.message || "Failed to update subject");
        }
      } catch (err) {
        console.error("❌ Error updating subject:", err);
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to update subject";
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setIsFormLoading(false);
      }
    }
  };

  // ✅ Handle Delete Subject using Axios
  const handleDeleteSubject = async (subjectToDelete) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${subjectToDelete.name}"?`
      )
    )
      return;

    try {
      setIsFormLoading(true);
      setError(null);
      const response = await api.delete(`/subject/${subjectToDelete._id}`);

      if (response.data?.success) {
        setSubjects((prev) =>
          prev.filter((s) => s._id !== subjectToDelete._id)
        );
        success(`Subject "${subjectToDelete.name}" deleted successfully!`);
      } else {
        setError(response.data?.message || "Failed to delete subject");
        showError(response.data?.message || "Failed to delete subject");
      }
    } catch (err) {
      console.error("❌ Error deleting subject:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete subject";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsFormLoading(false);
    }
  };

  // ✅ Handle Toggle Status
  const handleToggleStatus = async (subject) => {
    const currentStatus = subject.status || "active";
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const action = newStatus === "inactive" ? "deactivate" : "activate";

    if (
      window.confirm(
        `Are you sure you want to ${action} "${subject.name}"? All its children will also be ${action}d.`
      )
    ) {
      try {
        setIsFormLoading(true);
        setError(null);

        const response = await api.patch(`/subject/${subject._id}/status`, {
          status: newStatus,
        });

        if (response.data.success) {
          // Refetch subjects to get updated status from database
          await fetchSubjects();
          success(
            `Subject "${subject.name}" and all children ${action}d successfully!`
          );
        } else {
          setError(response.data.message || `Failed to ${action} subject`);
          showError(response.data.message || `Failed to ${action} subject`);
        }
      } catch (error) {
        console.error(`Error ${action}ing subject:`, error);
        const errorMessage =
          error.response?.data?.message ||
          `Failed to ${action} subject. Please try again.`;
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setIsFormLoading(false);
      }
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Subject Management
              </h1>
              <p className="text-sm text-gray-600">
                Manage and organize your subjects, create new ones, and track performance across your educational platform.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-[#0056FF] hover:bg-[#0044CC] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <FaPlus className="w-4 h-4" />
              <span>Add New Subject</span>
            </button>
          </div>
        </div>

        {/* Add Subject Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Add New Subject
              </h2>
              <button
                onClick={handleCancelForm}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                disabled={isFormLoading}
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="space-y-4">
              {/* Form Error Display */}
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <p className="text-sm font-medium text-red-800">
                      {formError}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subject Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Subject Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter subject name (e.g., Mathematics)"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400 transition-all"
                    required
                    disabled={isFormLoading}
                  />
                </div>

                {/* Exam Selection */}
                <div className="space-y-2">
                  <label
                    htmlFor="examId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Exam <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="examId"
                    name="examId"
                    value={formData.examId}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                    required
                    disabled={isFormLoading}
                  >
                    <option value="">Select an exam</option>
                    {exams.map((exam) => (
                      <option key={exam._id} value={exam._id}>
                        {exam.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  disabled={isFormLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={isFormLoading}
                >
                  {isFormLoading ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span>Adding Subject...</span>
                    </>
                  ) : (
                    <>
                      <FaSave className="w-4 h-4" />
                      <span>Add Subject</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Subjects Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Subjects List
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your subjects, view details, and perform actions
                </p>
              </div>
            </div>
          </div>

          {/* Filter Button */}
          <div className="px-6 py-3 border-b border-gray-200">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <FaFilter className="w-4 h-4" />
              Filter Subjects
              {activeFilterCount > 0 && (
                <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Section */}
          {showFilters && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Filter by Exam */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Filter by Exam
                  </label>
                  <select
                    value={filterExam}
                    onChange={(e) => setFilterExam(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                  >
                    <option value="">All Exams</option>
                    {exams.map((exam) => (
                      <option key={exam._id} value={exam._id}>
                        {exam.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filters */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
                  <span className="text-xs font-medium text-gray-600">
                    Active Filters:
                  </span>
                  {filterExam && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Exam:{" "}
                      {exams.find((e) => e._id === filterExam)?.name || "N/A"}
                      <button
                        onClick={() => setFilterExam("")}
                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={clearFilters}
                    className="ml-auto px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full text-xs font-medium transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="p-6">
            {isDataLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <LoadingSpinner size="medium" />
                  <p className="text-sm text-gray-500 mt-3">
                    Loading subjects...
                  </p>
                </div>
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <FaClipboardList className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Subjects Found
                </h3>
                <p className="text-sm text-gray-500 mb-4 max-w-sm">
                  {activeFilterCount > 0
                    ? "No subjects match your current filters."
                    : 'You haven\'t created any subjects yet. Click the "Add New Subject" button to get started.'}
                </p>
                {activeFilterCount > 0 ? (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <FaPlus className="w-4 h-4" />
                  Create Your First Subject
                </button>
              )}
              </div>
            ) : (
              <SubjectTable
                subjects={filteredSubjects}
                onEdit={handleEditSubject}
                onDelete={handleDeleteSubject}
                onToggleStatus={handleToggleStatus}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SubjectManagement;
