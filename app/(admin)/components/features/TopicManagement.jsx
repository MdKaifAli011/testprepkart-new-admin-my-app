"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import TopicsTable from "../table/TopicsTable";
import { LoadingWrapper, SkeletonChaptersTable } from "../ui/SkeletonLoader";
import { FaEdit, FaPlus, FaTimes, FaFilter, FaLock } from "react-icons/fa";
import api from "@/lib/api";
import { usePermissions, getPermissionMessage } from "../../hooks/usePermissions";

const TopicManagement = () => {
  const { canCreate, canEdit, canDelete, canReorder, role } = usePermissions();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [topics, setTopics] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    examId: "",
    subjectId: "",
    unitId: "",
    chapterId: "",
    orderNumber: "",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    examId: "",
    subjectId: "",
    unitId: "",
    chapterId: "",
    orderNumber: "",
  });
  const [additionalTopics, setAdditionalTopics] = useState([
    { name: "", orderNumber: "" },
  ]);
  const [nextOrderNumber, setNextOrderNumber] = useState(1);
  const [formError, setFormError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterExam, setFilterExam] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [filterChapter, setFilterChapter] = useState("");
  const isFetchingRef = useRef(false);

  // Fetch topics from API using Axios
  const fetchTopics = useCallback(async () => {
    if (isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      setIsDataLoading(true);
      setError(null);
      const response = await api.get("/topic");

      if (response.data.success) {
        setTopics(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch topics");
      }
    } catch (error) {
      console.error("❌ Error fetching topics:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch topics"
      );
    } finally {
      setIsDataLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Fetch exams from API
  const fetchExams = useCallback(async () => {
    try {
      const response = await api.get("/exam");
      if (response.data.success) {
        setExams(response.data.data);
      }
    } catch (error) {
      console.error("❌ Error fetching exams:", error);
    }
  }, []);

  // Fetch subjects from API
  const fetchSubjects = useCallback(async () => {
    try {
      const response = await api.get("/subject");
      if (response.data.success) {
        setSubjects(response.data.data);
      }
    } catch (error) {
      console.error("❌ Error fetching subjects:", error);
    }
  }, []);

  // Fetch units from API
  const fetchUnits = useCallback(async () => {
    try {
      const response = await api.get("/unit");
      if (response.data.success) {
        setUnits(response.data.data);
      }
    } catch (error) {
      console.error("❌ Error fetching units:", error);
    }
  }, []);

  // Fetch chapters from API
  const fetchChapters = useCallback(async () => {
    try {
      const response = await api.get("/chapter");
      if (response.data.success) {
        setChapters(response.data.data);
      }
    } catch (error) {
      console.error("❌ Error fetching chapters:", error);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchTopics();
    fetchExams();
    fetchSubjects();
    fetchUnits();
    fetchChapters();
  }, [fetchTopics, fetchExams, fetchSubjects, fetchUnits, fetchChapters]);

  // Filter subjects based on selected exam
  const filteredSubjects = useMemo(() => {
    if (formData.examId && subjects) {
      const filtered = subjects.filter(
        (subject) =>
          subject.examId._id === formData.examId ||
          subject.examId === formData.examId
      );
      return filtered;
    }
    return subjects || [];
  }, [formData.examId, subjects]);

  // Filter units based on selected subject
  const filteredUnits = useMemo(() => {
    if (formData.subjectId && units) {
      const filtered = units.filter(
        (unit) =>
          unit.subjectId._id === formData.subjectId ||
          unit.subjectId === formData.subjectId
      );
      return filtered;
    }
    return units || [];
  }, [formData.subjectId, units]);

  // Filter chapters based on selected unit
  const filteredChapters = useMemo(() => {
    let result = [];
    if (formData.unitId && chapters) {
      result = chapters.filter(
        (chapter) =>
          chapter.unitId._id === formData.unitId ||
          chapter.unitId === formData.unitId
      );
    } else {
      result = chapters || [];
    }
    // Sort by orderNumber in ascending order
    return result.sort((a, b) => {
      const ao = a.orderNumber || 0;
      const bo = b.orderNumber || 0;
      return ao - bo;
    });
  }, [formData.unitId, chapters]);

  // Filter subjects for edit form
  const filteredEditSubjects = useMemo(() => {
    if (editFormData.examId && subjects) {
      const filtered = subjects.filter(
        (subject) =>
          subject.examId._id === editFormData.examId ||
          subject.examId === editFormData.examId
      );
      return filtered;
    }
    return subjects || [];
  }, [editFormData.examId, subjects]);

  // Filter units for edit form
  const filteredEditUnits = useMemo(() => {
    if (editFormData.subjectId && units) {
      const filtered = units.filter(
        (unit) =>
          unit.subjectId._id === editFormData.subjectId ||
          unit.subjectId === editFormData.subjectId
      );
      return filtered;
    }
    return units || [];
  }, [editFormData.subjectId, units]);

  // Filter chapters for edit form
  const filteredEditChapters = useMemo(() => {
    let result = [];
    if (editFormData.unitId && chapters) {
      result = chapters.filter(
        (chapter) =>
          chapter.unitId._id === editFormData.unitId ||
          chapter.unitId === editFormData.unitId
      );
    } else {
      result = chapters || [];
    }
    // Sort by orderNumber in ascending order
    return result.sort((a, b) => {
      const ao = a.orderNumber || 0;
      const bo = b.orderNumber || 0;
      return ao - bo;
    });
  }, [editFormData.unitId, chapters]);

  // Filter subjects based on selected exam for filters
  const filteredFilterSubjects = useMemo(() => {
    if (!filterExam) return [];
    return subjects.filter(
      (subject) =>
        subject.examId?._id === filterExam || subject.examId === filterExam
    );
  }, [subjects, filterExam]);

  // Filter units based on selected subject for filters
  const filteredFilterUnits = useMemo(() => {
    if (!filterSubject) return [];
    return units.filter(
      (unit) =>
        unit.subjectId?._id === filterSubject ||
        unit.subjectId === filterSubject
    );
  }, [units, filterSubject]);

  // Filter chapters based on selected unit for filters
  const filteredFilterChapters = useMemo(() => {
    if (!filterUnit) return [];
    const filtered = chapters.filter(
      (chapter) =>
        chapter.unitId?._id === filterUnit || chapter.unitId === filterUnit
    );
    // Sort by orderNumber in ascending order
    return filtered.sort((a, b) => {
      const ao = a.orderNumber || 0;
      const bo = b.orderNumber || 0;
      return ao - bo;
    });
  }, [chapters, filterUnit]);

  // Filter topics based on filters
  const filteredTopics = useMemo(() => {
    let result = topics;
    if (filterExam) {
      result = result.filter(
        (topic) =>
          topic.examId?._id === filterExam || topic.examId === filterExam
      );
    }
    if (filterSubject) {
      result = result.filter(
        (topic) =>
          topic.subjectId?._id === filterSubject ||
          topic.subjectId === filterSubject
      );
    }
    if (filterUnit) {
      result = result.filter(
        (topic) =>
          topic.unitId?._id === filterUnit || topic.unitId === filterUnit
      );
    }
    if (filterChapter) {
      result = result.filter(
        (topic) =>
          topic.chapterId?._id === filterChapter ||
          topic.chapterId === filterChapter
      );
    }
    return result;
  }, [topics, filterExam, filterSubject, filterUnit, filterChapter]);

  // Get active filter count
  const activeFilterCount =
    (filterExam ? 1 : 0) +
    (filterSubject ? 1 : 0) +
    (filterUnit ? 1 : 0) +
    (filterChapter ? 1 : 0);

  // Clear all filters
  const clearFilters = () => {
    setFilterExam("");
    setFilterSubject("");
    setFilterUnit("");
    setFilterChapter("");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setFormData({
      name: "",
      examId: "",
      subjectId: "",
      unitId: "",
      chapterId: "",
      orderNumber: "",
    });
    setAdditionalTopics([{ name: "", orderNumber: "" }]);
    setFormError(null);
  };

  const handleCancelEditForm = () => {
    setShowEditForm(false);
    setEditingTopic(null);
    setEditFormData({
      name: "",
      examId: "",
      subjectId: "",
      unitId: "",
      chapterId: "",
      orderNumber: "",
    });
    setFormError(null);
  };

  const handleOpenAddForm = () => {
    setShowAddForm(true);
    setFormData({
      name: "",
      examId: "",
      subjectId: "",
      unitId: "",
      chapterId: "",
      orderNumber: "",
    });
    setAdditionalTopics([{ name: "", orderNumber: "" }]);
    setFormError(null);
  };

  const handleAddMoreTopics = () => {
    setAdditionalTopics((prev) => [...prev, { name: "", orderNumber: "" }]);
  };

  const handleRemoveTopic = (index) => {
    if (additionalTopics.length > 1) {
      setAdditionalTopics((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleAdditionalTopicChange = (index, field, value) => {
    setAdditionalTopics((prev) =>
      prev.map((topic, i) =>
        i === index ? { ...topic, [field]: value } : topic
      )
    );
  };

  const getNextOrderNumber = async (chapterId) => {
    try {
      const response = await api.get(`/topic?chapterId=${chapterId}`);
      if (response.data.success) {
        const existingTopics = response.data.data;
        const maxOrder = existingTopics.reduce(
          (max, topic) => Math.max(max, topic.orderNumber || 0),
          0
        );
        return maxOrder + 1;
      }
    } catch (error) {
      console.error("Error fetching next order number:", error);
    }
    return 1;
  };

  // Update order numbers when chapter is selected
  useEffect(() => {
    if (formData.chapterId) {
      getNextOrderNumber(formData.chapterId).then((orderNumber) => {
        setNextOrderNumber(orderNumber);
        setFormData((prev) => ({
          ...prev,
          orderNumber: orderNumber.toString(),
        }));
        setAdditionalTopics((prev) =>
          prev.map((topic, index) => ({
            ...topic,
            orderNumber: (orderNumber + index).toString(),
          }))
        );
      });
    }
  }, [formData.chapterId]);

  const handleAddTopics = async (e) => {
    e.preventDefault();

    // Check permissions
    if (!canCreate) {
      setFormError(getPermissionMessage("create", role));
      return;
    }

    setIsFormLoading(true);
    setFormError(null);

    try {
      const topicsToCreate = additionalTopics
        .filter((topic) => topic.name.trim())
        .map((topic, index) => ({
          name: topic.name,
          examId: formData.examId,
          subjectId: formData.subjectId,
          unitId: formData.unitId,
          chapterId: formData.chapterId,
          orderNumber: parseInt(topic.orderNumber) || nextOrderNumber + index,
        }));

      const response = await api.post("/topic", topicsToCreate);

      if (response.data.success) {
        const newTopics = Array.isArray(response.data.data)
          ? response.data.data
          : [response.data.data];
        setTopics((prevTopics) => [...prevTopics, ...newTopics]);
        handleCancelForm();
        console.log(`✅ ${newTopics.length} topic(s) created successfully`);
      } else {
        throw new Error(response.data.message || "Failed to create topics");
      }
    } catch (error) {
      console.error("❌ Error creating topics:", error);
      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create topics"
      );
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleEditTopic = (topicToEdit) => {
    // Check permissions
    if (!canEdit) {
      setFormError(getPermissionMessage("edit", role));
      return;
    }

    setEditingTopic(topicToEdit);
    setEditFormData({
      name: topicToEdit.name,
      examId: topicToEdit.examId._id || topicToEdit.examId,
      subjectId: topicToEdit.subjectId._id || topicToEdit.subjectId,
      unitId: topicToEdit.unitId._id || topicToEdit.unitId,
      chapterId: topicToEdit.chapterId._id || topicToEdit.chapterId,
      orderNumber: topicToEdit.orderNumber,
    });
    setShowEditForm(true);
  };

  const handleUpdateTopic = async (e) => {
    e.preventDefault();
    setIsFormLoading(true);
    setFormError(null);

    try {
      const response = await api.put(`/topic/${editingTopic._id}`, {
        name: editFormData.name,
        examId: editFormData.examId,
        subjectId: editFormData.subjectId,
        unitId: editFormData.unitId,
        chapterId: editFormData.chapterId,
        orderNumber: parseInt(editFormData.orderNumber),
      });

      if (response.data.success) {
        setTopics((prevTopics) =>
          prevTopics.map((t) =>
            t._id === editingTopic._id ? response.data.data : t
          )
        );
        handleCancelEditForm();
        console.log(
          `✅ Topic "${response.data.data.name}" updated successfully`
        );
      } else {
        throw new Error(response.data.message || "Failed to update topic");
      }
    } catch (error) {
      console.error("❌ Error updating topic:", error);
      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Failed to update topic"
      );
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleDeleteTopic = async (topicToDelete) => {
    // Check permissions
    if (!canDelete) {
      setFormError(getPermissionMessage("delete", role));
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete "${topicToDelete.name}"?`
      )
    ) {
      return;
    }

    setIsFormLoading(true);
    setError(null);

    try {
      const response = await api.delete(`/topic/${topicToDelete._id}`);

      if (response.data.success) {
        setTopics((prevTopics) =>
          prevTopics.filter((t) => t._id !== topicToDelete._id)
        );
        console.log(`✅ Topic "${topicToDelete.name}" deleted successfully`);
      } else {
        throw new Error(response.data.message || "Failed to delete topic");
      }
    } catch (error) {
      console.error("❌ Error deleting topic:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete topic"
      );
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleToggleStatus = async (topic) => {
    const currentStatus = topic.status || "active";
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const action = newStatus === "inactive" ? "deactivate" : "activate";

    if (
      window.confirm(
        `Are you sure you want to ${action} "${topic.name}"? All its children will also be ${action}d.`
      )
    ) {
      try {
        setIsFormLoading(true);
        setError(null);

        const response = await api.patch(`/topic/${topic._id}/status`, {
          status: newStatus,
        });

        if (response.data.success) {
          // Update the topic status in the list
          setTopics((prev) =>
            prev.map((t) =>
              t._id === topic._id ? { ...t, status: newStatus } : t
            )
          );
          console.log(
            `✅ Topic "${topic.name}" and all children ${action}d successfully`
          );
        } else {
          throw new Error(response.data.message || `Failed to ${action} topic`);
        }
      } catch (error) {
        console.error(`❌ Error ${action}ing topic:`, error);
        setError(
          error.response?.data?.message ||
            error.message ||
            `Failed to ${action} topic`
        );
      } finally {
        setIsFormLoading(false);
      }
    }
  };

  const handleDragEnd = async (result) => {
    // Check permissions
    if (!canReorder) {
      setFormError(getPermissionMessage("reorder", role));
      return;
    }

    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const reorderedItem = topics[sourceIndex];

    // Optimistic UI update
    const newTopics = Array.from(topics);
    const [removed] = newTopics.splice(sourceIndex, 1);
    newTopics.splice(destinationIndex, 0, removed);

    // Update order numbers
    const updatedTopics = newTopics.map((topic, index) => ({
      id: topic._id,
      orderNumber: index + 1,
    }));

    setTopics(newTopics);

    try {
      const response = await api.patch("/topic/reorder", {
        topics: updatedTopics,
      });

      if (response.data.success) {
        console.log(
          `✅ Topic "${reorderedItem.name}" moved to position ${
            destinationIndex + 1
          }`
        );
      } else {
        throw new Error(
          response.data.message || "Failed to update topic order"
        );
      }
    } catch (error) {
      console.error("❌ Error updating topic order:", error);
      console.log("🔄 Reverting topic order due to API error");
      fetchTopics(); // Revert local state
      setError(
        `Failed to update topic order: ${
          error.response?.data?.message || error.message
        }`
      );
      setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
    }
  };

  return (
    <LoadingWrapper
      isLoading={isDataLoading}
      skeleton={<SkeletonChaptersTable />}
    >
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Topic Management
              </h1>
              <p className="text-sm text-gray-600">
                Manage and organize your topics, create new topics, and track
                topic performance across your educational platform.
              </p>
            </div>
            {canCreate ? (
              <button
                onClick={handleOpenAddForm}
                className="px-4 py-2 bg-[#0056FF] hover:bg-[#0044CC] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <FaPlus className="w-4 h-4" />
                Add New Topic
              </button>
            ) : (
              <button
                disabled
                title={getPermissionMessage("create", role)}
                className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed flex items-center gap-2"
              >
                <FaLock className="w-4 h-4" />
                Add New Topic
              </button>
            )}
          </div>
        </div>

        {/* Add Topic Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Add New Topic{additionalTopics.length > 1 ? "s" : ""}
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
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <p className="text-sm font-medium text-red-800">
                    {formError}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleAddTopics} className="space-y-6">
              {/* Selection Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam *
                  </label>
                  <select
                    name="examId"
                    value={formData.examId}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Exam</option>
                    {exams.map((exam) => (
                      <option key={exam._id} value={exam._id}>
                        {exam.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    name="subjectId"
                    value={formData.subjectId}
                    onChange={handleFormChange}
                    required
                    disabled={!formData.examId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select Subject</option>
                    {filteredSubjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit *
                  </label>
                  <select
                    name="unitId"
                    value={formData.unitId}
                    onChange={handleFormChange}
                    required
                    disabled={!formData.subjectId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select Unit</option>
                    {filteredUnits.map((unit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chapter *
                  </label>
                  <select
                    name="chapterId"
                    value={formData.chapterId}
                    onChange={handleFormChange}
                    required
                    disabled={!formData.unitId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select Chapter</option>
                    {filteredChapters.map((chapter) => (
                      <option key={chapter._id} value={chapter._id}>
                        {chapter.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Topic Names */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">
                    Topic Names *
                  </h3>
                  {additionalTopics.length > 1 && (
                    <button
                      type="button"
                      onClick={handleAddMoreTopics}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      <FaPlus className="w-3 h-3" />
                      Add More
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {additionalTopics.map((topic, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder={`Topic ${index + 1} name`}
                          value={topic.name}
                          onChange={(e) =>
                            handleAdditionalTopicChange(
                              index,
                              "name",
                              e.target.value
                            )
                          }
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          placeholder="Order"
                          value={topic.orderNumber}
                          onChange={(e) =>
                            handleAdditionalTopicChange(
                              index,
                              "orderNumber",
                              e.target.value
                            )
                          }
                          min="1"
                          className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                        />
                      </div>
                      {additionalTopics.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(index)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FaTimes className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {additionalTopics.length === 1 && (
                  <button
                    type="button"
                    onClick={handleAddMoreTopics}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    <FaPlus className="w-3 h-3" />
                    Add More Topics
                  </button>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={isFormLoading}
                >
                  {isFormLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : (
                    `Add Topic${additionalTopics.length > 1 ? "s" : ""}`
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Topic Form */}
        {showEditForm && editingTopic && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaEdit className="size-3 text-blue-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">
                Edit Topic: {editingTopic.name}
              </h2>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateTopic} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam *
                  </label>
                  <select
                    name="examId"
                    value={editFormData.examId}
                    onChange={handleEditFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Exam</option>
                    {exams.map((exam) => (
                      <option key={exam._id} value={exam._id}>
                        {exam.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    name="subjectId"
                    value={editFormData.subjectId}
                    onChange={handleEditFormChange}
                    required
                    disabled={!editFormData.examId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select Subject</option>
                    {filteredEditSubjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit *
                  </label>
                  <select
                    name="unitId"
                    value={editFormData.unitId}
                    onChange={handleEditFormChange}
                    required
                    disabled={!editFormData.subjectId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select Unit</option>
                    {filteredEditUnits.map((unit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chapter *
                  </label>
                  <select
                    name="chapterId"
                    value={editFormData.chapterId}
                    onChange={handleEditFormChange}
                    required
                    disabled={!editFormData.unitId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select Chapter</option>
                    {filteredEditChapters.map((chapter) => (
                      <option key={chapter._id} value={chapter._id}>
                        {chapter.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Number *
                  </label>
                  <input
                    type="number"
                    name="orderNumber"
                    value={editFormData.orderNumber}
                    onChange={handleEditFormChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancelEditForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  disabled={isFormLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={isFormLoading}
                >
                  {isFormLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Topic"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Topics Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Topics List
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your topics, view details, and perform actions. You can
                  drag to reorder topics.
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
              Filter Topics
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Filter by Exam */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Filter by Exam
                  </label>
                  <select
                    value={filterExam}
                    onChange={(e) => {
                      setFilterExam(e.target.value);
                      setFilterSubject("");
                      setFilterUnit("");
                      setFilterChapter("");
                    }}
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

                {/* Filter by Subject */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Filter by Subject
                  </label>
                  <select
                    value={filterSubject}
                    onChange={(e) => {
                      setFilterSubject(e.target.value);
                      setFilterUnit("");
                      setFilterChapter("");
                    }}
                    disabled={!filterExam}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">
                      {filterExam ? "Select Exam First" : "All Subjects"}
                    </option>
                    {filteredFilterSubjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter by Unit */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Filter by Unit
                  </label>
                  <select
                    value={filterUnit}
                    onChange={(e) => {
                      setFilterUnit(e.target.value);
                      setFilterChapter("");
                    }}
                    disabled={!filterSubject}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">
                      {filterSubject ? "Select Subject First" : "All Units"}
                    </option>
                    {filteredFilterUnits.map((unit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter by Chapter */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Filter by Chapter
                  </label>
                  <select
                    value={filterChapter}
                    onChange={(e) => setFilterChapter(e.target.value)}
                    disabled={!filterUnit}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">
                      {filterUnit ? "Select Unit First" : "All Chapters"}
                    </option>
                    {filteredFilterChapters.map((chapter) => (
                      <option key={chapter._id} value={chapter._id}>
                        {chapter.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filters */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
                  <span className="text-xs font-semibold text-gray-600">
                    Active Filters:
                  </span>
                  {filterExam && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Exam:{" "}
                      {exams.find((e) => e._id === filterExam)?.name || "N/A"}
                      <button
                        onClick={() => {
                          setFilterExam("");
                          setFilterSubject("");
                          setFilterUnit("");
                          setFilterChapter("");
                        }}
                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterSubject && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Subject:{" "}
                      {subjects.find((s) => s._id === filterSubject)?.name ||
                        "N/A"}
                      <button
                        onClick={() => {
                          setFilterSubject("");
                          setFilterUnit("");
                          setFilterChapter("");
                        }}
                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterUnit && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Unit:{" "}
                      {units.find((u) => u._id === filterUnit)?.name || "N/A"}
                      <button
                        onClick={() => {
                          setFilterUnit("");
                          setFilterChapter("");
                        }}
                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterChapter && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Chapter:{" "}
                      {chapters.find((c) => c._id === filterChapter)?.name ||
                        "N/A"}
                      <button
                        onClick={() => setFilterChapter("")}
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
            <TopicsTable
              topics={filteredTopics}
              onEdit={handleEditTopic}
              onDelete={handleDeleteTopic}
              onDragEnd={handleDragEnd}
              onToggleStatus={handleToggleStatus}
            />
          </div>
        </div>
      </div>
    </LoadingWrapper>
  );
};

export default TopicManagement;
