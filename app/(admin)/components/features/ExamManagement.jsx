"use client";
import React, { useState, useEffect, useRef } from "react";
import ExamTable from "../table/ExamTable";
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
} from "react-icons/fa";
import { ToastContainer, useToast } from "../ui/Toast";
import api from "@/lib/api";

const ExamManagement = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [exams, setExams] = useState([]);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    status: "active",
  });
  const [formError, setFormError] = useState(null);
  const { toasts, removeToast, success, error: showError } = useToast();
  const isFetchingRef = useRef(false);

  // Fetch exams from API using Axios
  const fetchExams = async () => {
    if (isFetchingRef.current) return; // prevent overlapping fetches
    isFetchingRef.current = true;
    try {
      setIsDataLoading(true);
      setError(null);
      // Fetch all exams (active and inactive) to show correct status
      const response = await api.get("/exam?status=all");

      if (response.data?.success) {
        setExams(response.data.data || []);
      } else {
        setError(response.data?.message || "Failed to fetch exams");
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
      const errorMessage =
        error?.response?.data?.message ||
        "Failed to fetch exams. Please check your connection.";
      setError(errorMessage);
    } finally {
      setIsDataLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Load exams on component mount
  useEffect(() => {
    fetchExams();
  }, []);

  const handleAddExam = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setFormError("Please enter an exam name");
      return;
    }

    try {
      setIsFormLoading(true);
      setFormError(null);

      const response = await api.post("/exam", {
        name: formData.name.trim(),
        status: formData.status,
      });

      if (response.data.success) {
        // Add the new exam to the list
        setExams((prevExams) => [...prevExams, response.data.data]);
        success(`Exam "${formData.name}" added successfully!`);
        // Reset form
        setFormData({
          name: "",
          status: "active",
        });
        setShowAddForm(false);
      } else {
        setFormError(response.data.message || "Failed to add exam");
        showError(response.data.message || "Failed to add exam");
      }
    } catch (error) {
      console.error("Error adding exam:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to add exam. Please try again.";
      setFormError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError(null);
  };

  const handleCancelForm = () => {
    setFormData({
      name: "",
      status: "active",
    });
    setFormError(null);
    setShowAddForm(false);
  };

  const handleEditExam = async (exam) => {
    const newName = prompt("Enter new exam name:", exam.name);
    if (newName && newName.trim() !== exam.name) {
      try {
        setIsFormLoading(true);
        setError(null);

        const response = await api.put(`/exam/${exam._id}`, {
          name: newName.trim(),
        });

        if (response.data.success) {
          // Update the exam in the list
          setExams((prevExams) =>
            prevExams.map((e) => (e._id === exam._id ? response.data.data : e))
          );
          success("Exam updated successfully!");
        } else {
          setError(response.data.message || "Failed to update exam");
          showError(response.data.message || "Failed to update exam");
        }
      } catch (error) {
        console.error("Error updating exam:", error);
        const errorMessage =
          error.response?.data?.message ||
          "Failed to update exam. Please try again.";
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setIsFormLoading(false);
      }
    }
  };

  const handleDeleteExam = async (exam) => {
    if (window.confirm(`Are you sure you want to delete "${exam.name}"?`)) {
      try {
        setIsFormLoading(true);
        setError(null);

        const response = await api.delete(`/exam/${exam._id}`);

        if (response.data.success) {
          // Remove the exam from the list
          setExams((prevExams) => prevExams.filter((e) => e._id !== exam._id));
          success(`Exam "${exam.name}" deleted successfully!`);
        } else {
          setError(response.data.message || "Failed to delete exam");
          showError(response.data.message || "Failed to delete exam");
        }
      } catch (error) {
        console.error("Error deleting exam:", error);
        const errorMessage =
          error.response?.data?.message ||
          "Failed to delete exam. Please try again.";
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setIsFormLoading(false);
      }
    }
  };

  const handleToggleStatus = async (exam) => {
    const currentStatus = exam.status || "active";
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const action = newStatus === "inactive" ? "deactivate" : "activate";

    if (
      window.confirm(
        `Are you sure you want to ${action} "${exam.name}"? All its children will also be ${action}d.`
      )
    ) {
      try {
        setIsFormLoading(true);
        setError(null);

        const response = await api.patch(`/exam/${exam._id}`, {
          status: newStatus,
        });

        if (response.data.success) {
          // Refetch exams to get updated status from database
          await fetchExams();
          success(
            `Exam "${exam.name}" and all children ${action}d successfully!`
          );
        } else {
          setError(response.data.message || `Failed to ${action} exam`);
          showError(response.data.message || `Failed to ${action} exam`);
        }
      } catch (error) {
        console.error(`Error ${action}ing exam:`, error);
        const errorMessage =
          error.response?.data?.message ||
          `Failed to ${action} exam. Please try again.`;
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
        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Exam Management
              </h1>
              <p className="text-sm text-gray-600">
                Manage and organize your exams, create new assessments, and track exam performance across your educational platform.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-[#0056FF] hover:bg-[#0044CC] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <FaPlus className="w-4 h-4" />
              <span>Add New Exam</span>
            </button>
          </div>
        </div>

        {/* Add Exam Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Add New Exam
              </h2>
              <button
                onClick={handleCancelForm}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                disabled={isFormLoading}
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExam} className="space-y-4">
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
                {/* Exam Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Exam Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter exam name (e.g., JEE Main 2024)"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400 transition-all"
                    required
                    disabled={isFormLoading}
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                    disabled={isFormLoading}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
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
                      <span>Adding Exam...</span>
                    </>
                  ) : (
                    <>
                      <FaSave className="w-4 h-4" />
                      <span>Add Exam</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Content Area */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Exams List
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your exams, view details, and perform actions
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {isDataLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <LoadingSpinner size="medium" />
                  <p className="text-sm text-gray-500 mt-3">Loading exams...</p>
                </div>
              </div>
            ) : exams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <FaClipboardList className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Exams Found
                </h3>
                <p className="text-sm text-gray-500 mb-4 max-w-sm">
                  You haven&apos;t created any exams yet. Click the &quot;Add
                  New Exam&quot; button to get started.
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2"
                >
                  <FaPlus className="w-4 h-4" />
                  Create Your First Exam
                </button>
              </div>
            ) : (
              <ExamTable
                exams={exams}
                onEdit={handleEditExam}
                onDelete={handleDeleteExam}
                onToggleStatus={handleToggleStatus}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ExamManagement;
