"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import SubTopicsTable from "../table/SubTopicsTable";
import { LoadingWrapper, SkeletonChaptersTable } from "../ui/SkeletonLoader";
import { FaEdit, FaPlus, FaTimes, FaFilter } from "react-icons/fa";
import api from "@/lib/api";

const SubTopicsManagement = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingSubTopic, setEditingSubTopic] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subTopics, setSubTopics] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    examId: "",
    subjectId: "",
    unitId: "",
    chapterId: "",
    topicId: "",
    orderNumber: "",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    examId: "",
    subjectId: "",
    unitId: "",
    chapterId: "",
    topicId: "",
    orderNumber: "",
  });
  const [additionalSubTopics, setAdditionalSubTopics] = useState([
    { name: "", orderNumber: "" },
  ]);
  const [nextOrderNumber, setNextOrderNumber] = useState(1);
  const [formError, setFormError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterExam, setFilterExam] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [filterChapter, setFilterChapter] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const isFetchingRef = useRef(false);

  // Fetch sub topics from API using Axios
  const fetchSubTopics = useCallback(async () => {
    if (isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      setIsDataLoading(true);
      setError(null);
      const response = await api.get("/subtopic");

      if (response.data.success) {
        setSubTopics(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch sub topics");
      }
    } catch (error) {
      console.error("❌ Error fetching sub topics:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch sub topics"
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

  // Fetch topics from API
  const fetchTopics = useCallback(async () => {
    try {
      const response = await api.get("/topic");
      if (response.data.success) {
        setTopics(response.data.data);
      }
    } catch (error) {
      console.error("❌ Error fetching topics:", error);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchSubTopics();
    fetchExams();
    fetchSubjects();
    fetchUnits();
    fetchChapters();
    fetchTopics();
  }, [
    fetchSubTopics,
    fetchExams,
    fetchSubjects,
    fetchUnits,
    fetchChapters,
    fetchTopics,
  ]);

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

  // Filter topics based on selected chapter
  const filteredTopics = useMemo(() => {
    let result = [];
    if (formData.chapterId && topics) {
      result = topics.filter(
        (topic) =>
          topic.chapterId._id === formData.chapterId ||
          topic.chapterId === formData.chapterId
      );
    } else {
      result = topics || [];
    }
    // Sort by orderNumber in ascending order
    return result.sort((a, b) => {
      const ao = a.orderNumber || 0;
      const bo = b.orderNumber || 0;
      return ao - bo;
    });
  }, [formData.chapterId, topics]);

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

  // Filter topics for edit form
  const filteredEditTopics = useMemo(() => {
    let result = [];
    if (editFormData.chapterId && topics) {
      result = topics.filter(
        (topic) =>
          topic.chapterId._id === editFormData.chapterId ||
          topic.chapterId === editFormData.chapterId
      );
    } else {
      result = topics || [];
    }
    // Sort by orderNumber in ascending order
    return result.sort((a, b) => {
      const ao = a.orderNumber || 0;
      const bo = b.orderNumber || 0;
      return ao - bo;
    });
  }, [editFormData.chapterId, topics]);

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

  // Filter topics based on selected chapter for filters
  const filteredFilterTopics = useMemo(() => {
    if (!filterChapter) return [];
    const filtered = topics.filter(
      (topic) =>
        topic.chapterId?._id === filterChapter ||
        topic.chapterId === filterChapter
    );
    // Sort by orderNumber in ascending order
    return filtered.sort((a, b) => {
      const ao = a.orderNumber || 0;
      const bo = b.orderNumber || 0;
      return ao - bo;
    });
  }, [topics, filterChapter]);

  // Filter subTopics based on filters
  const filteredSubTopics = useMemo(() => {
    let result = subTopics;
    if (filterExam) {
      result = result.filter(
        (subTopic) =>
          subTopic.examId?._id === filterExam || subTopic.examId === filterExam
      );
    }
    if (filterSubject) {
      result = result.filter(
        (subTopic) =>
          subTopic.subjectId?._id === filterSubject ||
          subTopic.subjectId === filterSubject
      );
    }
    if (filterUnit) {
      result = result.filter(
        (subTopic) =>
          subTopic.unitId?._id === filterUnit || subTopic.unitId === filterUnit
      );
    }
    if (filterChapter) {
      result = result.filter(
        (subTopic) =>
          subTopic.chapterId?._id === filterChapter ||
          subTopic.chapterId === filterChapter
      );
    }
    if (filterTopic) {
      result = result.filter(
        (subTopic) =>
          subTopic.topicId?._id === filterTopic ||
          subTopic.topicId === filterTopic
      );
    }
    return result;
  }, [
    subTopics,
    filterExam,
    filterSubject,
    filterUnit,
    filterChapter,
    filterTopic,
  ]);

  // Get active filter count
  const activeFilterCount =
    (filterExam ? 1 : 0) +
    (filterSubject ? 1 : 0) +
    (filterUnit ? 1 : 0) +
    (filterChapter ? 1 : 0) +
    (filterTopic ? 1 : 0);

  // Clear all filters
  const clearFilters = () => {
    setFilterExam("");
    setFilterSubject("");
    setFilterUnit("");
    setFilterChapter("");
    setFilterTopic("");
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
      topicId: "",
      orderNumber: "",
    });
    setAdditionalSubTopics([{ name: "", orderNumber: "" }]);
    setFormError(null);
  };

  const handleCancelEditForm = () => {
    setShowEditForm(false);
    setEditingSubTopic(null);
    setEditFormData({
      name: "",
      examId: "",
      subjectId: "",
      unitId: "",
      chapterId: "",
      topicId: "",
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
      topicId: "",
      orderNumber: "",
    });
    setAdditionalSubTopics([{ name: "", orderNumber: "" }]);
    setFormError(null);
  };

  const handleAddMoreSubTopics = () => {
    setAdditionalSubTopics((prev) => [...prev, { name: "", orderNumber: "" }]);
  };

  const handleRemoveSubTopic = (index) => {
    if (additionalSubTopics.length > 1) {
      setAdditionalSubTopics((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleAdditionalSubTopicChange = (index, field, value) => {
    setAdditionalSubTopics((prev) =>
      prev.map((subTopic, i) =>
        i === index ? { ...subTopic, [field]: value } : subTopic
      )
    );
  };

  const getNextOrderNumber = async (topicId) => {
    try {
      const response = await api.get(`/subtopic?topicId=${topicId}`);
      if (response.data.success) {
        const existingSubTopics = response.data.data;
        const maxOrder = existingSubTopics.reduce(
          (max, subTopic) => Math.max(max, subTopic.orderNumber || 0),
          0
        );
        return maxOrder + 1;
      }
    } catch (error) {
      console.error("Error fetching next order number:", error);
    }
    return 1;
  };

  // Update order numbers when topic is selected
  useEffect(() => {
    if (formData.topicId) {
      getNextOrderNumber(formData.topicId).then((orderNumber) => {
        setNextOrderNumber(orderNumber);
        setFormData((prev) => ({
          ...prev,
          orderNumber: orderNumber.toString(),
        }));
        setAdditionalSubTopics((prev) =>
          prev.map((subTopic, index) => ({
            ...subTopic,
            orderNumber: (orderNumber + index).toString(),
          }))
        );
      });
    }
  }, [formData.topicId]);

  const handleAddSubTopics = async (e) => {
    e.preventDefault();
    setIsFormLoading(true);
    setFormError(null);

    try {
      const subTopicsToCreate = additionalSubTopics
        .filter((subTopic) => subTopic.name.trim())
        .map((subTopic, index) => ({
          name: subTopic.name,
          examId: formData.examId,
          subjectId: formData.subjectId,
          unitId: formData.unitId,
          chapterId: formData.chapterId,
          topicId: formData.topicId,
          orderNumber:
            parseInt(subTopic.orderNumber) || nextOrderNumber + index,
        }));

      const response = await api.post("/subtopic", subTopicsToCreate);

      if (response.data.success) {
        const newSubTopics = Array.isArray(response.data.data)
          ? response.data.data
          : [response.data.data];
        setSubTopics((prevSubTopics) => [...prevSubTopics, ...newSubTopics]);
        handleCancelForm();
        console.log(
          `✅ ${newSubTopics.length} sub topic(s) created successfully`
        );
      } else {
        throw new Error(response.data.message || "Failed to create sub topics");
      }
    } catch (error) {
      console.error("❌ Error creating sub topics:", error);
      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create sub topics"
      );
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleEditSubTopic = (subTopicToEdit) => {
    setEditingSubTopic(subTopicToEdit);
    setEditFormData({
      name: subTopicToEdit.name,
      examId: subTopicToEdit.examId._id || subTopicToEdit.examId,
      subjectId: subTopicToEdit.subjectId._id || subTopicToEdit.subjectId,
      unitId: subTopicToEdit.unitId._id || subTopicToEdit.unitId,
      chapterId: subTopicToEdit.chapterId._id || subTopicToEdit.chapterId,
      topicId: subTopicToEdit.topicId._id || subTopicToEdit.topicId,
      orderNumber: subTopicToEdit.orderNumber,
    });
    setShowEditForm(true);
  };

  const handleUpdateSubTopic = async (e) => {
    e.preventDefault();
    setIsFormLoading(true);
    setFormError(null);

    try {
      const response = await api.put(`/subtopic/${editingSubTopic._id}`, {
        name: editFormData.name,
        examId: editFormData.examId,
        subjectId: editFormData.subjectId,
        unitId: editFormData.unitId,
        chapterId: editFormData.chapterId,
        topicId: editFormData.topicId,
        orderNumber: parseInt(editFormData.orderNumber),
      });

      if (response.data.success) {
        setSubTopics((prevSubTopics) =>
          prevSubTopics.map((st) =>
            st._id === editingSubTopic._id ? response.data.data : st
          )
        );
        handleCancelEditForm();
        console.log(
          `✅ Sub Topic "${response.data.data.name}" updated successfully`
        );
      } else {
        throw new Error(response.data.message || "Failed to update sub topic");
      }
    } catch (error) {
      console.error("❌ Error updating sub topic:", error);
      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Failed to update sub topic"
      );
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleDeleteSubTopic = async (subTopicToDelete) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${subTopicToDelete.name}"?`
      )
    ) {
      return;
    }

    setIsFormLoading(true);
    setError(null);

    try {
      const response = await api.delete(`/subtopic/${subTopicToDelete._id}`);

      if (response.data.success) {
        setSubTopics((prevSubTopics) =>
          prevSubTopics.filter((st) => st._id !== subTopicToDelete._id)
        );
        console.log(
          `✅ Sub Topic "${subTopicToDelete.name}" deleted successfully`
        );
      } else {
        throw new Error(response.data.message || "Failed to delete sub topic");
      }
    } catch (error) {
      console.error("❌ Error deleting sub topic:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete sub topic"
      );
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleToggleStatus = async (subTopic) => {
    const currentStatus = subTopic.status || "active";
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const action = newStatus === "inactive" ? "deactivate" : "activate";

    if (
      window.confirm(
        `Are you sure you want to ${action} "${subTopic.name}"? All its children will also be ${action}d.`
      )
    ) {
      try {
        setIsFormLoading(true);
        setError(null);

        const response = await api.patch(`/subtopic/${subTopic._id}/status`, {
          status: newStatus,
        });

        if (response.data.success) {
          // Update the subtopic status in the list
          setSubTopics((prev) =>
            prev.map((st) =>
              st._id === subTopic._id ? { ...st, status: newStatus } : st
            )
          );
          console.log(`✅ SubTopic "${subTopic.name}" ${action}d successfully`);
        } else {
          throw new Error(
            response.data.message || `Failed to ${action} sub topic`
          );
        }
      } catch (error) {
        console.error(`❌ Error ${action}ing subtopic:`, error);
        setError(
          error.response?.data?.message ||
            error.message ||
            `Failed to ${action} subtopic`
        );
      } finally {
        setIsFormLoading(false);
      }
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const reorderedItem = filteredSubTopics[sourceIndex];

    // Optimistic UI update - work with filtered list but update full list
    const filtered = [...filteredSubTopics];
    const [removed] = filtered.splice(sourceIndex, 1);
    filtered.splice(destinationIndex, 0, removed);

    // Update order numbers based on filtered list
    const updatedSubTopics = filtered.map((subTopic, index) => ({
      id: subTopic._id,
      orderNumber: index + 1,
    }));

    // Update the full subTopics list
    const updatedFullList = subTopics.map((st) => {
      const updatedItem = updatedSubTopics.find((u) => u.id === st._id);
      return updatedItem ? { ...st, orderNumber: updatedItem.orderNumber } : st;
    });

    setSubTopics(updatedFullList);

    try {
      const response = await api.patch("/subtopic/reorder", {
        subTopics: updatedSubTopics,
      });

      if (response.data.success) {
        console.log(
          `✅ Sub Topic "${reorderedItem.name}" moved to position ${
            destinationIndex + 1
          }`
        );
      } else {
        throw new Error(
          response.data.message || "Failed to update sub topic order"
        );
      }
    } catch (error) {
      console.error("❌ Error updating sub topic order:", error);
      console.log("🔄 Reverting sub topic order due to API error");
      fetchSubTopics(); // Revert local state
      setError(
        `Failed to update sub topic order: ${
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
                Sub Topics Management
              </h1>
              <p className="text-sm text-gray-600">
                Manage and organize your sub topics, create new sub topics, and track sub topic performance across your educational platform.
              </p>
            </div>
            <button
              onClick={handleOpenAddForm}
              className="px-4 py-2 bg-[#0056FF] hover:bg-[#0044CC] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <FaPlus className="w-4 h-4" />
              Add New Sub Topic
            </button>
          </div>
        </div>

        {/* Add Sub Topic Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaPlus className="size-3 text-blue-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">
                Add New Sub Topic{additionalSubTopics.length > 1 ? "s" : ""}
              </h2>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSubTopics} className="space-y-6">
              {/* Selection Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic *
                  </label>
                  <select
                    name="topicId"
                    value={formData.topicId}
                    onChange={handleFormChange}
                    required
                    disabled={!formData.chapterId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select Topic</option>
                    {filteredTopics.map((topic) => (
                      <option key={topic._id} value={topic._id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sub Topic Names */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">
                    Sub Topic Names *
                  </h3>
                  {additionalSubTopics.length > 1 && (
                    <button
                      type="button"
                      onClick={handleAddMoreSubTopics}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      <FaPlus className="w-3 h-3" />
                      Add More
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {additionalSubTopics.map((subTopic, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder={`Sub Topic ${index + 1} name`}
                          value={subTopic.name}
                          onChange={(e) =>
                            handleAdditionalSubTopicChange(
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
                          value={subTopic.orderNumber}
                          onChange={(e) =>
                            handleAdditionalSubTopicChange(
                              index,
                              "orderNumber",
                              e.target.value
                            )
                          }
                          min="1"
                          className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                        />
                      </div>
                      {additionalSubTopics.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSubTopic(index)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FaTimes className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {additionalSubTopics.length === 1 && (
                  <button
                    type="button"
                    onClick={handleAddMoreSubTopics}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    <FaPlus className="w-3 h-3" />
                    Add More Sub Topics
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
                    `Add Sub Topic${additionalSubTopics.length > 1 ? "s" : ""}`
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Sub Topic Form */}
        {showEditForm && editingSubTopic && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaEdit className="size-3 text-blue-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">
                Edit Sub Topic: {editingSubTopic.name}
              </h2>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateSubTopic} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic *
                  </label>
                  <select
                    name="topicId"
                    value={editFormData.topicId}
                    onChange={handleEditFormChange}
                    required
                    disabled={!editFormData.chapterId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select Topic</option>
                    {filteredEditTopics.map((topic) => (
                      <option key={topic._id} value={topic._id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sub Topic Name *
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
                    "Update Sub Topic"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sub Topics Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Sub Topics List
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your sub topics, view details, and perform actions. You can
                  drag to reorder sub topics.
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
              Filter Sub Topics
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                {/* Filter by Exam */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Filter by Exam
                  </label>
                  <select
                    value={filterExam}
                    onChange={(e) => {
                      setFilterExam(e.target.value);
                      setFilterSubject("");
                      setFilterUnit("");
                      setFilterChapter("");
                      setFilterTopic("");
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm bg-white"
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
                      setFilterTopic("");
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
                      setFilterTopic("");
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
                    onChange={(e) => {
                      setFilterChapter(e.target.value);
                      setFilterTopic("");
                    }}
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

                {/* Filter by Topic */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Filter by Topic
                  </label>
                  <select
                    value={filterTopic}
                    onChange={(e) => setFilterTopic(e.target.value)}
                    disabled={!filterChapter}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">
                      {filterChapter ? "Select Chapter First" : "All Topics"}
                    </option>
                    {filteredFilterTopics.map((topic) => (
                      <option key={topic._id} value={topic._id}>
                        {topic.name}
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
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      Exam:{" "}
                      {exams.find((e) => e._id === filterExam)?.name || "N/A"}
                      <button
                        onClick={() => {
                          setFilterExam("");
                          setFilterSubject("");
                          setFilterUnit("");
                          setFilterChapter("");
                          setFilterTopic("");
                        }}
                        className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterSubject && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                      Subject:{" "}
                      {subjects.find((s) => s._id === filterSubject)?.name ||
                        "N/A"}
                      <button
                        onClick={() => {
                          setFilterSubject("");
                          setFilterUnit("");
                          setFilterChapter("");
                          setFilterTopic("");
                        }}
                        className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterUnit && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      Unit:{" "}
                      {units.find((u) => u._id === filterUnit)?.name || "N/A"}
                      <button
                        onClick={() => {
                          setFilterUnit("");
                          setFilterChapter("");
                          setFilterTopic("");
                        }}
                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterChapter && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                      Chapter:{" "}
                      {chapters.find((c) => c._id === filterChapter)?.name ||
                        "N/A"}
                      <button
                        onClick={() => {
                          setFilterChapter("");
                          setFilterTopic("");
                        }}
                        className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filterTopic && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                      Topic:{" "}
                      {topics.find((t) => t._id === filterTopic)?.name || "N/A"}
                      <button
                        onClick={() => setFilterTopic("")}
                        className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={clearFilters}
                    className="ml-auto px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full text-xs font-semibold transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="p-6">
            <SubTopicsTable
              subTopics={filteredSubTopics}
              onEdit={handleEditSubTopic}
              onDelete={handleDeleteSubTopic}
              onDragEnd={handleDragEnd}
              onToggleStatus={handleToggleStatus}
            />
          </div>
        </div>
      </div>
    </LoadingWrapper>
  );
};

export default SubTopicsManagement;
