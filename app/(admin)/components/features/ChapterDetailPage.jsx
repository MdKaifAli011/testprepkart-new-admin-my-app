"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaArrowLeft, FaSave, FaEdit, FaLock } from "react-icons/fa";
import { ToastContainer, useToast } from "../ui/Toast";
import { LoadingSpinner } from "../ui/SkeletonLoader";
import RichTextEditor from "../ui/RichTextEditor";
import api from "@/lib/api";
import { usePermissions, getPermissionMessage } from "../../hooks/usePermissions";

const ChapterDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const chapterId = params.id;
  const { canEdit, role } = usePermissions();

  const [chapter, setChapter] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    title: "",
    metaDescription: "",
    keywords: "",
  });
  const { toasts, removeToast, success, error: showError } = useToast();
  const isFetchingRef = useRef(false);

  const fetchChapterDetails = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      setIsLoading(true);
      // Fetch main chapter and details in parallel
      const [chapterRes, detailsRes] = await Promise.all([
        api.get(`/chapter/${chapterId}`),
        api.get(`/chapter/${chapterId}/details`),
      ]);
      
      if (chapterRes.data?.success) {
        const data = chapterRes.data.data;
        setChapter(data);
        
        // Get details or use defaults
        const details = detailsRes.data?.success ? detailsRes.data.data : {
          content: "",
          title: "",
          metaDescription: "",
          keywords: "",
        };
        
        setFormData({
          name: data.name || "",
          content: details.content || "",
          title: details.title || "",
          metaDescription: details.metaDescription || "",
          keywords: details.keywords || "",
        });
      } else setError(chapterRes.data?.message || "Failed to fetch chapter details");
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to fetch chapter details"
      );
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [chapterId]);

  useEffect(() => {
    if (chapterId) fetchChapterDetails();
  }, [chapterId, fetchChapterDetails]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    // Check permissions
    if (!canEdit) {
      showError(getPermissionMessage("edit", role));
      return;
    }

    try {
      setIsSaving(true);
      // Save main chapter and details separately
      const [chapterRes, detailsRes] = await Promise.all([
        api.put(`/chapter/${chapterId}`, { name: formData.name }),
        api.put(`/chapter/${chapterId}/details`, {
          content: formData.content,
          title: formData.title,
          metaDescription: formData.metaDescription,
          keywords: formData.keywords,
        }),
      ]);
      
      if (chapterRes.data?.success && detailsRes.data?.success) {
        success("Chapter details saved successfully!");
        setChapter(chapterRes.data.data);
        setIsEditing(false);
      } else {
        showError(chapterRes.data?.message || detailsRes.data?.message || "Save failed");
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl p-12 border border-blue-100 animate-fadeInUp">
          <LoadingSpinner size="large" />
          <h3 className="text-xl font-bold text-gray-900 mt-6">
            Loading Chapter...
          </h3>
          <p className="text-gray-500 text-sm">
            Please wait while we fetch the details.
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-10 border border-red-100 animate-fadeInUp">
          <span className="text-3xl mb-4 inline-block">⚠️</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Error Loading Chapter
          </h3>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:scale-105 hover:shadow-lg text-white rounded-xl font-medium transition-all duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );

  if (!chapter)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-10 border border-gray-100 animate-fadeInUp">
          <span className="text-3xl mb-4 inline-block">📘</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Chapter Not Found
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            The requested chapter could not be found.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gradient-to-r from-gray-500 to-blue-500 hover:scale-105 hover:shadow-lg text-white rounded-xl font-medium transition-all duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-100 p-4 mb-8 flex justify-between items-center animate-fadeInUp">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-700 hover:text-gray-900 p-3 rounded-xl hover:bg-white/70 transition-all duration-200"
          >
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">
              {isEditing ? "Edit Chapter" : chapter.name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Order:{" "}
              <span className="font-medium text-indigo-600">
                {chapter.orderNumber || "1"}
              </span>
              {" • "}
              Unit:{" "}
              <span className="font-medium text-indigo-600">
                {chapter.unitId?.name || "Unknown"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-2 py-2 bg-white border border-gray-300 rounded-xl hover:shadow-md text-gray-800 font-semibold transition-all duration-200"
              >
                Cancel
              </button>
              {canEdit ? (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-2 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 hover:shadow-lg text-white rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
                >
                  {isSaving ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <FaSave className="w-4 h-4" />
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              ) : (
                <button
                  disabled
                  title={getPermissionMessage("edit", role)}
                  className="px-2 py-2 bg-gray-300 text-gray-500 rounded-xl font-semibold flex items-center gap-2 cursor-not-allowed transition-all duration-200"
                >
                  <FaLock className="w-4 h-4" />
                  Save Changes
                </button>
              )}
            </>
          ) : canEdit ? (
            <button
              onClick={() => {
                if (canEdit) {
                  setIsEditing(true);
                } else {
                  showError(getPermissionMessage("edit", role));
                }
              }}
              className="px-2 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 hover:shadow-lg text-white rounded-xl font-semibold flex items-center gap-2 transition-all duration-200"
            >
              <FaEdit className="w-4 h-4" />
              Edit Chapter
            </button>
          ) : (
            <button
              disabled
              title={getPermissionMessage("edit", role)}
              className="px-2 py-2 bg-gray-300 text-gray-500 rounded-xl font-semibold flex items-center gap-2 cursor-not-allowed transition-all duration-200"
            >
              <FaLock className="w-4 h-4" />
              Edit Chapter
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8 animate-fadeInUp">
        {/* Chapter Content */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-emerald-500 text-2xl">📘</span> Chapter
            Content
          </h2>
          <RichTextEditor
            value={formData.content}
            onChange={(v) => setFormData({ ...formData, content: v })}
            placeholder="Write detailed content for this chapter..."
            disabled={!isEditing}
          />
        </div>

        {/* SEO Meta Section */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-orange-500 text-2xl">🔍</span> SEO Meta
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Enter page title for SEO..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed shadow-sm text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/60 characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Keywords
              </label>
              <input
                type="text"
                name="keywords"
                value={formData.keywords}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="keyword1, keyword2, keyword3"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed shadow-sm text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate keywords with commas
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Meta Description
              </label>
              <textarea
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleChange}
                disabled={!isEditing}
                rows={3}
                placeholder="Write a compelling meta description for SEO..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed shadow-sm text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.metaDescription.length}/160 characters
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChapterDetailPage;

