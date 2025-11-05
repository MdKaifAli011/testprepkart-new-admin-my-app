import api from "@/lib/api";
import {
  createSlug as createSlugUtil,
  findByIdOrSlug as findByIdOrSlugUtil,
} from "@/utils/slug";
import { STATUS } from "@/constants";
import { logger } from "@/utils/logger";

// Create slug utility function for use in this file (local variable)
const createSlugLocal = createSlugUtil;

// Fetch all active exams (with pagination support)
export const fetchExams = async (options = {}) => {
  try {
    const { page = 1, limit = 100, status = STATUS.ACTIVE } = options;
    const response = await api.get(
      `/exam?page=${page}&limit=${limit}&status=${status}`
    );

    if (response.data.success) {
      // Handle paginated response
      if (response.data.pagination) {
        return response.data.data || [];
      }
      // Handle legacy response format
      return (response.data.data || []).filter(
        (exam) => exam.status === STATUS.ACTIVE
      );
    }
    return [];
  } catch (error) {
    logger.error("Error fetching exams:", error);
    return [];
  }
};

// Fetch exam by ID or name
export const fetchExamById = async (examId) => {
  if (!examId) return null;

  try {
    // Try by ID first
    const response = await api.get(`/exam/${examId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
  } catch (error) {
    // If not found by ID (400/404), try fetching all and finding by name
    if (error.response?.status === 400 || error.response?.status === 404) {
      try {
        const exams = await fetchExams({ limit: 100 });
        const examIdLower = examId?.toLowerCase();
        const found = exams.find(
          (exam) =>
            exam._id === examId ||
            exam.name?.toLowerCase() === examIdLower ||
            createSlugLocal(exam.name) === examIdLower
        );

        // If found by slug, fetch the full exam data by its actual ID to get all fields including content
        if (found && found._id) {
          try {
            const fullResponse = await api.get(`/exam/${found._id}`);
            if (fullResponse.data.success && fullResponse.data.data) {
              return fullResponse.data.data;
            }
          } catch (fullErr) {
            // If full fetch fails, return the found exam (might not have all fields)
            // Silently fail - return partial data
            return found;
          }
        }

        return found || null;
      } catch (err) {
        // Silently fail - return null
        return null;
      }
    }
    // For other errors, return null
    return null;
  }

  return null;
};

// Fetch subjects by exam ID (optimized with pagination)
export const fetchSubjectsByExam = async (examId, options = {}) => {
  try {
    const { page = 1, limit = 100 } = options;
    const response = await api.get(
      `/subject?examId=${examId}&page=${page}&limit=${limit}&status=${STATUS.ACTIVE}`
    );

    if (response.data.success) {
      // Handle paginated response
      if (response.data.pagination) {
        return response.data.data || [];
      }
      // Handle legacy response format
      const allSubjects = response.data.data || [];
      const filteredSubjects = allSubjects.filter(
        (subject) =>
          (subject.examId?._id === examId ||
            subject.examId === examId ||
            subject.examId?.name?.toLowerCase() === examId?.toLowerCase()) &&
          subject.status === STATUS.ACTIVE
      );
      // Sort by orderNumber
      return filteredSubjects.sort(
        (a, b) => (a.orderNumber || 0) - (b.orderNumber || 0)
      );
    }
    return [];
  } catch (error) {
    logger.error("Error fetching subjects:", error);
    return [];
  }
};

// Fetch subject by ID or slug
export const fetchSubjectById = async (subjectId) => {
  if (!subjectId) return null;

  try {
    const response = await api.get(`/subject/${subjectId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    // If not found by ID, try fetching from subjects list
    if (error.response?.status === 400 || error.response?.status === 404) {
      try {
        // Try to find by slug in all subjects
        const response = await api.get(`/subject?page=1&limit=100`);
        if (response.data.success && response.data.data) {
          const subjects = response.data.data;
          const subjectSlug = subjectId?.toLowerCase();
          const found = subjects.find(
            (subject) =>
              subject._id === subjectId ||
              createSlugLocal(subject.name) === subjectSlug ||
              subject.name?.toLowerCase() === subjectSlug
          );
          return found || null;
        }
      } catch (err) {
        // Silently fail
        return null;
      }
    }
    return null;
  }
};

// Fetch units by subject ID and exam ID (optimized with pagination)
export const fetchUnitsBySubject = async (subjectId, examId, options = {}) => {
  try {
    const { page = 1, limit = 100 } = options;
    const url = `/unit?subjectId=${subjectId}${
      examId ? `&examId=${examId}` : ""
    }&page=${page}&limit=${limit}&status=${STATUS.ACTIVE}`;
    const response = await api.get(url);

    if (response.data.success) {
      // Handle paginated response
      if (response.data.pagination) {
        return response.data.data || [];
      }
      // Handle legacy response format
      const filteredUnits = (response.data.data || []).filter(
        (unit) => unit.status === STATUS.ACTIVE
      );
      // Sort by orderNumber
      return filteredUnits.sort(
        (a, b) => (a.orderNumber || 0) - (b.orderNumber || 0)
      );
    }
    return [];
  } catch (error) {
    logger.error("Error fetching units:", error);
    return [];
  }
};

// Fetch chapters by unit ID (optimized with pagination)
export const fetchChaptersByUnit = async (unitId, options = {}) => {
  try {
    const { page = 1, limit = 100 } = options;
    const response = await api.get(
      `/chapter?unitId=${unitId}&page=${page}&limit=${limit}&status=${STATUS.ACTIVE}`
    );

    if (response.data.success) {
      // Handle paginated response
      if (response.data.pagination) {
        return response.data.data || [];
      }
      // Handle legacy response format
      const filteredChapters = (response.data.data || []).filter(
        (chapter) => chapter.status === STATUS.ACTIVE
      );
      // Sort by orderNumber
      return filteredChapters.sort(
        (a, b) => (a.orderNumber || 0) - (b.orderNumber || 0)
      );
    }
    return [];
  } catch (error) {
    logger.error("Error fetching chapters:", error);
    return [];
  }
};

// Fetch chapters by subject ID
export const fetchChaptersBySubject = async (subjectId, examId) => {
  try {
    let url = `/chapter?subjectId=${subjectId}`;
    if (examId) {
      url += `&examId=${examId}`;
    }
    const response = await api.get(url);
    if (response.data.success) {
      // Filter only active chapters
      return response.data.data.filter(
        (chapter) => chapter.status === "active"
      );
    }
    return [];
  } catch (error) {
    logger.error("Error fetching chapters by subject:", error);
    return [];
  }
};

// Fetch all chapters for a subject (through units)
export const fetchAllChaptersForSubject = async (subjectId, examId) => {
  try {
    // First fetch units for this subject
    const units = await fetchUnitsBySubject(subjectId, examId);

    // Then fetch chapters for each unit
    const allChapters = [];
    for (const unit of units) {
      const chapters = await fetchChaptersByUnit(unit._id);
      allChapters.push(...chapters);
    }

    // Sort by orderNumber
    return allChapters.sort(
      (a, b) => (a.orderNumber || 0) - (b.orderNumber || 0)
    );
  } catch (error) {
    logger.error("Error fetching all chapters for subject:", error);
    return [];
  }
};

// Fetch unit by ID or slug
export const fetchUnitById = async (unitId) => {
  if (!unitId) return null;

  try {
    const response = await api.get(`/unit/${unitId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    // If not found by ID, try fetching all and finding by slug
    if (error.response?.status === 400 || error.response?.status === 404) {
      try {
        const response = await api.get(`/unit?page=1&limit=100`);
        if (response.data.success && response.data.data) {
          const units = response.data.data;
          const unitSlug = unitId?.toLowerCase();
          const found = units.find(
            (unit) =>
              unit._id === unitId ||
              createSlugLocal(unit.name) === unitSlug ||
              unit.name?.toLowerCase() === unitSlug
          );
          return found || null;
        }
      } catch (err) {
        // Silently fail
        return null;
      }
    }
    return null;
  }
};

// Fetch chapter by ID or slug
export const fetchChapterById = async (chapterId) => {
  if (!chapterId) return null;

  try {
    const response = await api.get(`/chapter/${chapterId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    // If not found by ID, try fetching all and finding by slug
    if (error.response?.status === 400 || error.response?.status === 404) {
      try {
        const response = await api.get(`/chapter?page=1&limit=100`);
        if (response.data.success && response.data.data) {
          const chapters = response.data.data;
          const chapterSlug = chapterId?.toLowerCase();
          const found = chapters.find(
            (chapter) =>
              chapter._id === chapterId ||
              createSlugLocal(chapter.name) === chapterSlug ||
              chapter.name?.toLowerCase() === chapterSlug
          );
          return found || null;
        }
      } catch (err) {
        // Silently fail
        return null;
      }
    }
    return null;
  }
};

// Fetch topics by chapter ID (optimized with pagination)
export const fetchTopicsByChapter = async (chapterId, options = {}) => {
  try {
    const { page = 1, limit = 100 } = options;
    const response = await api.get(
      `/topic?chapterId=${chapterId}&page=${page}&limit=${limit}&status=${STATUS.ACTIVE}`
    );

    if (response.data.success) {
      // Handle paginated response
      if (response.data.pagination) {
        return response.data.data || [];
      }
      // Handle legacy response format
      const filteredTopics = (response.data.data || []).filter(
        (topic) => topic.status === STATUS.ACTIVE
      );
      // Sort by orderNumber
      return filteredTopics.sort(
        (a, b) => (a.orderNumber || 0) - (b.orderNumber || 0)
      );
    }
    return [];
  } catch (error) {
    logger.error("Error fetching topics:", error);
    return [];
  }
};

// Fetch topic by ID or slug
export const fetchTopicById = async (topicId) => {
  if (!topicId) return null;

  try {
    const response = await api.get(`/topic/${topicId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    // If not found by ID, try fetching all and finding by slug
    if (error.response?.status === 400 || error.response?.status === 404) {
      try {
        const response = await api.get(`/topic?page=1&limit=100`);
        if (response.data.success && response.data.data) {
          const topics = response.data.data;
          const topicSlug = topicId?.toLowerCase();
          const found = topics.find(
            (topic) =>
              topic._id === topicId ||
              createSlugLocal(topic.name) === topicSlug ||
              topic.name?.toLowerCase() === topicSlug
          );
          return found || null;
        }
      } catch (err) {
        // Silently fail
        return null;
      }
    }
    return null;
  }
};

// Fetch subtopics by topic ID (optimized with pagination)
export const fetchSubTopicsByTopic = async (topicId, options = {}) => {
  try {
    const { page = 1, limit = 100 } = options;
    const response = await api.get(
      `/subtopic?topicId=${topicId}&page=${page}&limit=${limit}&status=${STATUS.ACTIVE}`
    );

    if (response.data.success) {
      // Handle paginated response
      if (response.data.pagination) {
        return response.data.data || [];
      }
      // Handle legacy response format
      const filteredSubTopics = (response.data.data || []).filter(
        (sub) => sub.status === STATUS.ACTIVE
      );
      // Sort by orderNumber
      return filteredSubTopics.sort(
        (a, b) => (a.orderNumber || 0) - (b.orderNumber || 0)
      );
    }
    return [];
  } catch (error) {
    logger.error("Error fetching subtopics:", error);
    return [];
  }
};

// Fetch subtopic by ID or slug
export const fetchSubTopicById = async (subTopicId) => {
  if (!subTopicId) return null;

  try {
    const response = await api.get(`/subtopic/${subTopicId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    // If not found by ID, try fetching all and finding by slug
    if (error.response?.status === 400 || error.response?.status === 404) {
      try {
        const response = await api.get(`/subtopic?page=1&limit=100`);
        if (response.data.success && response.data.data) {
          const subtopics = response.data.data;
          const subtopicSlug = subTopicId?.toLowerCase();
          const found = subtopics.find(
            (subtopic) =>
              subtopic._id === subTopicId ||
              createSlugLocal(subtopic.name) === subtopicSlug ||
              subtopic.name?.toLowerCase() === subtopicSlug
          );
          return found || null;
        }
      } catch (err) {
        // Silently fail
        return null;
      }
    }
    return null;
  }
};

// Re-export slug utilities for backward compatibility
export const createSlug = createSlugUtil;
export const findByIdOrSlug = findByIdOrSlugUtil;
