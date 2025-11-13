"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FaPlus,
  FaTimes,
  FaSave,
  FaLock,
  FaEdit,
  FaTrash,
  FaPowerOff,
  FaVideo,
  FaCheckCircle,
} from "react-icons/fa";
import { ToastContainer, useToast } from "../ui/Toast";
import api from "@/lib/api";
import {
  usePermissions,
  getPermissionMessage,
} from "../../hooks/usePermissions";
import { LoadingWrapper, SkeletonPageContent } from "../ui/SkeletonLoader";

const PracticeQuestionManagement = ({ subCategoryId }) => {
  const { canCreate, canEdit, canDelete, canReorder, role } = usePermissions();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [currentSubCategory, setCurrentSubCategory] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    answer: "",
    videoLink: "",
    detailsExplanation: "",
  });
  const [formError, setFormError] = useState(null);
  const { toasts, removeToast, success, error: showError } = useToast();
  const isFetchingRef = useRef(false);
  const showErrorRef = useRef(showError);

  // Keep showError ref updated
  useEffect(() => {
    showErrorRef.current = showError;
  }, [showError]);

  // ✅ Fetch Current SubCategory Details
  const fetchCurrentSubCategory = useCallback(async () => {
    if (!subCategoryId) {
      setCurrentSubCategory(null);
      return;
    }
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsDataLoading(true);
    setError(null);
    try {
      const response = await api.get(`/practice/subcategory/${subCategoryId}`);
      if (response.data?.success) {
        setCurrentSubCategory(response.data.data);
      } else {
        const errorMsg =
          response.data?.message || "Failed to load paper details";
        setError(errorMsg);
        showErrorRef.current(errorMsg);
      }
    } catch (err) {
      console.error("❌ Error fetching current subcategory:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to load paper details";
      setError(errorMessage);
      showErrorRef.current(errorMessage);
    } finally {
      setIsDataLoading(false);
      isFetchingRef.current = false;
    }
  }, [subCategoryId]);

  useEffect(() => {
    fetchCurrentSubCategory();
  }, [fetchCurrentSubCategory]);

  // ✅ Fetch Questions
  const fetchQuestions = useCallback(async () => {
    if (!subCategoryId) {
      setQuestions([]);
      return;
    }
    setIsQuestionsLoading(true);
    try {
      const response = await api.get(
        `/practice/question?subCategoryId=${subCategoryId}&status=all`
      );
      if (response.data?.success) {
        setQuestions(response.data.data || []);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error("❌ Error fetching questions:", err);
      showErrorRef.current("Failed to load questions");
      setQuestions([]);
    } finally {
      setIsQuestionsLoading(false);
    }
  }, [subCategoryId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // ✅ Handle Form Change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError(null);
  };

  // ✅ Handle Cancel Form
  const handleCancelForm = () => {
    setFormData({
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      answer: "",
      videoLink: "",
      detailsExplanation: "",
    });
    setFormError(null);
    setEditingQuestion(null);
    setShowAddForm(false);
  };

  // ✅ Handle Edit Question
  const handleEditQuestion = (question) => {
    if (!canEdit) {
      showErrorRef.current(getPermissionMessage("edit", role));
      return;
    }
    setEditingQuestion(question);
    setFormData({
      question: question.question || "",
      optionA: question.optionA || "",
      optionB: question.optionB || "",
      optionC: question.optionC || "",
      optionD: question.optionD || "",
      answer: question.answer || "",
      videoLink: question.videoLink || "",
      detailsExplanation: question.detailsExplanation || "",
    });
    setShowAddForm(true);
    setFormError(null);
  };

  // ✅ Handle Delete Question
  const handleDeleteQuestion = async (questionToDelete) => {
    if (!canDelete) {
      showErrorRef.current(getPermissionMessage("delete", role));
      return;
    }
    if (!window.confirm(`Are you sure you want to delete this question?`))
      return;

    try {
      setIsFormLoading(true);
      const response = await api.delete(
        `/practice/question/${questionToDelete._id}`
      );
      if (response.data?.success) {
        await fetchQuestions();
        success("Question deleted successfully!");
      } else {
        throw new Error(response.data?.message || "Failed to delete question");
      }
    } catch (err) {
      console.error("❌ Error deleting question:", err);
      showErrorRef.current(
        err.response?.data?.message || "Failed to delete question"
      );
    } finally {
      setIsFormLoading(false);
    }
  };

  // ✅ Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.question?.trim()) {
      setFormError("Question is required");
      return;
    }
    if (!formData.optionA?.trim()) {
      setFormError("Option A is required");
      return;
    }
    if (!formData.optionB?.trim()) {
      setFormError("Option B is required");
      return;
    }
    if (!formData.optionC?.trim()) {
      setFormError("Option C is required");
      return;
    }
    if (!formData.optionD?.trim()) {
      setFormError("Option D is required");
      return;
    }
    if (!formData.answer) {
      setFormError("Please select the correct answer");
      return;
    }
    if (!["A", "B", "C", "D"].includes(formData.answer.toUpperCase())) {
      setFormError("Answer must be A, B, C, or D");
      return;
    }

    setIsFormLoading(true);
    try {
      const payload = {
        subCategoryId: subCategoryId,
        question: formData.question.trim(),
        optionA: formData.optionA.trim(),
        optionB: formData.optionB.trim(),
        optionC: formData.optionC.trim(),
        optionD: formData.optionD.trim(),
        answer: formData.answer.toUpperCase(),
        videoLink: formData.videoLink?.trim() || "",
        detailsExplanation: formData.detailsExplanation?.trim() || "",
      };

      let response;
      if (editingQuestion) {
        response = await api.put(
          `/practice/question/${editingQuestion._id}`,
          payload
        );
      } else {
        response = await api.post("/practice/question", payload);
      }

      if (response.data?.success) {
        await fetchQuestions();
        success(
          `Question ${editingQuestion ? "updated" : "created"} successfully!`
        );
        handleCancelForm();
      } else {
        throw new Error(response.data?.message || "Failed to save question");
      }
    } catch (err) {
      console.error("❌ Error creating question:", err);
      showError(err.response?.data?.message || "Failed to create question");
    } finally {
      setIsFormLoading(false);
    }
  };

  // Show error if subCategoryId is not provided
  if (!subCategoryId) {
    return (
      <>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="bg-white rounded-lg border border-red-200 p-6 shadow-sm">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Paper Not Found
            </h2>
            <p className="text-gray-600">
              Please select a paper to manage questions.
            </p>
          </div>
        </div>
      </>
    );
  }

  if (isDataLoading) {
    return (
      <>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <LoadingWrapper>
          <SkeletonPageContent />
        </LoadingWrapper>
      </>
    );
  }

  // Show error state if fetch failed
  if (error && !currentSubCategory) {
    return (
      <>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="bg-white rounded-lg border border-red-200 p-6 shadow-sm">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Failed to Load Paper
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchCurrentSubCategory()}
              className="px-4 py-2 bg-[#0056FF] hover:bg-[#0044CC] text-white rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-linear-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                {currentSubCategory?.name || "Practice Question Management"}
              </h1>
              <p className="text-sm text-gray-600">
                {currentSubCategory
                  ? `Manage questions for ${currentSubCategory.name}. Add, edit, and organize practice questions for this paper.`
                  : "Manage and organize your practice questions, create new questions, and track question performance."}
              </p>
            </div>
            {canCreate ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-[#0056FF] hover:bg-[#0044CC] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <FaPlus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            ) : (
              <button
                disabled
                title={getPermissionMessage("create", role)}
                className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed flex items-center gap-2"
              >
                <FaLock className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            )}
          </div>
        </div>

        {/* Add Question Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingQuestion ? "Edit Question" : "Add New Question"}
              </h2>
              <button
                onClick={handleCancelForm}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                disabled={isFormLoading}
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Question */}
              <div>
                <label
                  htmlFor="question"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Question <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="question"
                  name="question"
                  value={formData.question}
                  onChange={handleFormChange}
                  rows={4}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter the question here..."
                />
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option A */}
                <div>
                  <label
                    htmlFor="optionA"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Option A <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="optionA"
                    name="optionA"
                    value={formData.optionA}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter option A"
                  />
                </div>

                {/* Option B */}
                <div>
                  <label
                    htmlFor="optionB"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Option B <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="optionB"
                    name="optionB"
                    value={formData.optionB}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter option B"
                  />
                </div>

                {/* Option C */}
                <div>
                  <label
                    htmlFor="optionC"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Option C <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="optionC"
                    name="optionC"
                    value={formData.optionC}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter option C"
                  />
                </div>

                {/* Option D */}
                <div>
                  <label
                    htmlFor="optionD"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Option D <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="optionD"
                    name="optionD"
                    value={formData.optionD}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter option D"
                  />
                </div>
              </div>

              {/* Answer Selection */}
              <div>
                <label
                  htmlFor="answer"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Correct Answer <span className="text-red-500">*</span>
                </label>
                <select
                  id="answer"
                  name="answer"
                  value={formData.answer}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select correct answer</option>
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>

              {/* Video Link */}
              <div>
                <label
                  htmlFor="videoLink"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Video Link/URL
                </label>
                <input
                  type="url"
                  id="videoLink"
                  name="videoLink"
                  value={formData.videoLink}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="https://example.com/video or YouTube URL"
                />
              </div>

              {/* Details Explanation */}
              <div>
                <label
                  htmlFor="detailsExplanation"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Details Explanation
                </label>
                <textarea
                  id="detailsExplanation"
                  name="detailsExplanation"
                  value={formData.detailsExplanation}
                  onChange={handleFormChange}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter detailed explanation for the answer..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  disabled={isFormLoading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFormLoading}
                  className="px-4 py-2 bg-[#0056FF] hover:bg-[#0044CC] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFormLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FaSave className="w-4 h-4" />
                      <span>Save Question</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Questions List - MCQ Display */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Questions List ({questions.length})
            </h2>
          </div>

          <LoadingWrapper
            isLoading={isQuestionsLoading}
            skeleton={<SkeletonPageContent />}
          >
            {questions.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-400 text-6xl mb-4">❓</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Questions Found
                </h3>
                <p className="text-sm text-gray-500">
                  Add your first question to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div
                    key={question._id || index}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                            {index + 1}
                          </span>
                          <h3 className="text-base font-semibold text-gray-900">
                            Question
                          </h3>
                        </div>
                        <p className="text-gray-700 ml-11 leading-relaxed">
                          {question.question}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {canEdit && (
                          <button
                            onClick={() => handleEditQuestion(question)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg transition-colors hover:bg-blue-100"
                            title="Edit Question"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteQuestion(question)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100"
                            title="Delete Question"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-11 mb-4">
                      {["A", "B", "C", "D"].map((option) => {
                        const optionKey = `option${option}`;
                        const optionText = question[optionKey];
                        const isCorrect = question.answer === option;
                        return (
                          <div
                            key={option}
                            className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors ${
                              isCorrect
                                ? "bg-green-50 border-green-300"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div
                              className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-semibold text-sm ${
                                isCorrect
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-300 text-gray-700"
                              }`}
                            >
                              {option}
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                              <span className="text-gray-700 flex-1">
                                {optionText}
                              </span>
                              {isCorrect && (
                                <FaCheckCircle className="text-green-500 shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Additional Info */}
                    <div className="ml-11 space-y-3 pt-4 border-t border-gray-200">
                      {/* Correct Answer Badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">
                          Correct Answer:
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                          Option {question.answer}
                        </span>
                      </div>

                      {/* Video Link */}
                      {question.videoLink && (
                        <div className="flex items-center gap-2">
                          <FaVideo className="text-gray-400" />
                          <a
                            href={question.videoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Watch Video Explanation
                          </a>
                        </div>
                      )}

                      {/* Details Explanation */}
                      {question.detailsExplanation && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-blue-900 mb-2">
                            Explanation:
                          </h4>
                          <p className="text-sm text-blue-800 leading-relaxed">
                            {question.detailsExplanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </LoadingWrapper>
        </div>
      </div>
    </>
  );
};

export default PracticeQuestionManagement;
