import api from "@/lib/api";
import {
  createSlug as createSlugUtil,
  findByIdOrSlug as findByIdOrSlugUtil,
} from "@/utils/slug";
import { STATUS } from "@/constants";
import { logger } from "@/utils/logger";

// Create slug utility function for use in this file (local variable)
const createSlugLocal = createSlugUtil;

// Helper to get base URL for server-side requests
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // Client-side: use relative URL
    return "";
  }
  // Server-side: use absolute URL from environment or default to localhost
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
};

// Fetch all active exams (with pagination support)
export const fetchExams = async (options = {}) => {
  try {
    const { page = 1, limit = 100, status = STATUS.ACTIVE } = options;

    // Check if we're on server side
    const isServer = typeof window === "undefined";
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/exam?page=${page}&limit=${limit}&status=${status}`;

    // Use fetch for server-side, axios for client-side
    if (isServer) {
      const response = await fetch(url, {
        next: { revalidate: 60 }, // Cache for 60 seconds
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      if (data.success && data.data) {
        // API already filters by status correctly, so return all data
        // Only do a safety check to ensure we have valid exams with names
        const exams = data.data || [];
        return exams.filter((exam) => exam && exam.name);
      }
      return [];
    } else {
      // Client-side: use axios
      const response = await api.get(
        `/exam?page=${page}&limit=${limit}&status=${status}`
      );

      if (response.data.success && response.data.data) {
        // API already filters by status correctly, so return all data
        // Only do a safety check to ensure we have valid exams with names
        const exams = response.data.data || [];
        return exams.filter((exam) => exam && exam.name);
      }
      return [];
    }
  } catch (error) {
    logger.error("Error fetching exams:", error);
    return [];
  }
};

// Fetch exam by ID or name/slug
export const fetchExamById = async (examId) => {
  if (!examId) return null;

  const isServer = typeof window === "undefined";
  const baseUrl = getBaseUrl();

  try {
    // Try by ID first (only if it looks like an ObjectId)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(examId);
    if (isObjectId) {
      if (isServer) {
        // Server-side: use fetch
        try {
          const response = await fetch(`${baseUrl}/api/exam/${examId}`, {
            next: { revalidate: 60 },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              return data.data;
            }
          }
        } catch (err) {
          // Continue to fallback
        }
      } else {
        // Client-side: use axios
        try {
          const response = await api.get(`/exam/${examId}`);
          if (response.data.success && response.data.data) {
            return response.data.data;
          }
        } catch (error) {
          // Continue to fallback
        }
      }
    }
  } catch (error) {
    // Continue to fallback
  }

  // Fallback: fetch all exams and find by slug
  try {
    const exams = await fetchExams({ limit: 100 });
    const examIdLower = examId?.toLowerCase();
    const found = exams.find(
      (exam) =>
        exam._id === examId ||
        exam.name?.toLowerCase() === examIdLower ||
        createSlugLocal(exam.name) === examIdLower
    );

    // If found by slug, fetch the full exam data by its actual ID
    if (found && found._id) {
      try {
        if (isServer) {
          const response = await fetch(`${baseUrl}/api/exam/${found._id}`, {
            next: { revalidate: 60 },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              return data.data;
            }
          }
          return found;
        } else {
          const fullResponse = await api.get(`/exam/${found._id}`);
          if (fullResponse.data.success && fullResponse.data.data) {
            return fullResponse.data.data;
          }
          return found;
        }
      } catch (fullErr) {
        return found;
      }
    }

    return found || null;
  } catch (err) {
    logger.warn("Error fetching exam by slug:", err.message);
    return null;
  }
};

// Fetch subjects by exam ID (optimized with pagination)
export const fetchSubjectsByExam = async (examId, options = {}) => {
  try {
    const { page = 1, limit = 100 } = options;
    
    if (!examId) {
      logger.warn("fetchSubjectsByExam: No examId provided");
      return [];
    }
    
    const url = `/subject?examId=${examId}&page=${page}&limit=${limit}&status=${STATUS.ACTIVE}`;
    logger.info("fetchSubjectsByExam: Fetching from URL:", url);
    
    const response = await api.get(url);

    logger.info("fetchSubjectsByExam: Response received:", {
      success: response.data?.success,
      hasPagination: !!response.data?.pagination,
      dataLength: response.data?.data?.length,
      examId,
    });

    if (response.data?.success) {
      const subjects = response.data.data || [];
      
      // Handle paginated response - API already filters by examId, but let's verify
      if (response.data.pagination) {
        // Double-check that subjects belong to the correct exam
        const validSubjects = subjects.filter((subject) => {
          const subjectExamId = subject.examId?._id || subject.examId;
          const matchesExam = 
            String(subjectExamId) === String(examId) ||
            subject.examId?.name?.toLowerCase() === String(examId).toLowerCase();
          const matchesStatus = subject.status
            ? subject.status.toLowerCase() === STATUS.ACTIVE.toLowerCase()
            : false;
          return matchesExam && matchesStatus;
        });
        
        logger.info("fetchSubjectsByExam: Filtered subjects:", {
          originalCount: subjects.length,
          filteredCount: validSubjects.length,
          examId,
        });
        
        // Sort by orderNumber
        return validSubjects.sort(
          (a, b) => (a.orderNumber || 0) - (b.orderNumber || 0)
        );
      }
      
      // Handle legacy response format
      const filteredSubjects = subjects.filter((subject) => {
        const subjectExamId = subject.examId?._id || subject.examId;
        const matchesExam =
          String(subjectExamId) === String(examId) ||
          subject.examId === examId ||
          subject.examId?.name?.toLowerCase() === String(examId).toLowerCase();
        const matchesStatus = subject.status
          ? subject.status.toLowerCase() === STATUS.ACTIVE.toLowerCase()
          : false;
        return matchesExam && matchesStatus;
      });
      // Sort by orderNumber
      return filteredSubjects.sort(
        (a, b) => (a.orderNumber || 0) - (b.orderNumber || 0)
      );
    }
    
    logger.warn("fetchSubjectsByExam: Response not successful:", response.data);
    return [];
  } catch (error) {
    logger.error("Error fetching subjects:", error);
    logger.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      examId,
    });
    return [];
  }
};

// Fetch subject by ID or slug
export const fetchSubjectById = async (subjectId) => {
  if (!subjectId) return null;

  const isServer = typeof window === "undefined";
  const baseUrl = getBaseUrl();

  try {
    // Try by ID first (only if it looks like an ObjectId)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(subjectId);
    if (isObjectId) {
      if (isServer) {
        // Server-side: use fetch
        try {
          const response = await fetch(`${baseUrl}/api/subject/${subjectId}`, {
            next: { revalidate: 60 },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              return data.data;
            }
          }
        } catch (err) {
          // Continue to fallback
        }
      } else {
        // Client-side: use axios
        try {
          const response = await api.get(`/subject/${subjectId}`);
          if (response.data.success && response.data.data) {
            return response.data.data;
          }
        } catch (error) {
          // Continue to fallback
        }
      }
    }
  } catch (error) {
    // Continue to fallback
  }

  // Fallback: try to fetch all subjects (this is less efficient, but works)
  // Note: This fallback requires an examId, so it may not work perfectly
  // For now, we'll return null if we can't find by ID
  return null;
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
        (unit) =>
          unit.status &&
          unit.status.toLowerCase() === STATUS.ACTIVE.toLowerCase()
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
        (chapter) =>
          chapter.status &&
          chapter.status.toLowerCase() === STATUS.ACTIVE.toLowerCase()
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
      // Filter only active chapters (case-insensitive)
      return response.data.data.filter(
        (chapter) =>
          chapter.status &&
          chapter.status.toLowerCase() === STATUS.ACTIVE.toLowerCase()
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

  const isServer = typeof window === "undefined";
  const baseUrl = getBaseUrl();

  try {
    // Try by ID first (only if it looks like an ObjectId)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(unitId);
    if (isObjectId) {
      if (isServer) {
        // Server-side: use fetch
        try {
          const response = await fetch(`${baseUrl}/api/unit/${unitId}`, {
            next: { revalidate: 60 },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              return data.data;
            }
          }
        } catch (err) {
          // Continue to fallback
        }
      } else {
        // Client-side: use axios
        try {
          const response = await api.get(`/unit/${unitId}`);
          if (response.data.success && response.data.data) {
            return response.data.data;
          }
        } catch (error) {
          // Continue to fallback
        }
      }
    }
  } catch (error) {
    // Continue to fallback
  }

  // Fallback: try fetching all units (this is less efficient, but works)
  // Note: This fallback requires a subjectId or examId, so it may not work perfectly
  // For now, we'll return null if we can't find by ID
  return null;
};

// Fetch chapter by ID or slug
export const fetchChapterById = async (chapterId) => {
  if (!chapterId) return null;

  const isServer = typeof window === "undefined";
  const baseUrl = getBaseUrl();

  try {
    // Try by ID first (only if it looks like an ObjectId)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(chapterId);
    if (isObjectId) {
      if (isServer) {
        // Server-side: use fetch
        try {
          const response = await fetch(`${baseUrl}/api/chapter/${chapterId}`, {
            next: { revalidate: 60 },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              return data.data;
            }
          }
        } catch (err) {
          // Continue to fallback
        }
      } else {
        // Client-side: use axios
        try {
          const response = await api.get(`/chapter/${chapterId}`);
          if (response.data.success && response.data.data) {
            return response.data.data;
          }
        } catch (error) {
          // Continue to fallback
        }
      }
    }
  } catch (error) {
    // Continue to fallback
  }

  // Fallback: try fetching all chapters (this is less efficient, but works)
  // Note: This fallback requires a unitId, so it may not work perfectly
  // For now, we'll return null if we can't find by ID
  return null;
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
        (topic) =>
          topic.status &&
          topic.status.toLowerCase() === STATUS.ACTIVE.toLowerCase()
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

  const isServer = typeof window === "undefined";
  const baseUrl = getBaseUrl();

  try {
    // Try by ID first (only if it looks like an ObjectId)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(topicId);
    if (isObjectId) {
      if (isServer) {
        // Server-side: use fetch
        try {
          const response = await fetch(`${baseUrl}/api/topic/${topicId}`, {
            next: { revalidate: 60 },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              return data.data;
            }
          }
        } catch (err) {
          // Continue to fallback
        }
      } else {
        // Client-side: use axios
        try {
          const response = await api.get(`/topic/${topicId}`);
          if (response.data.success && response.data.data) {
            return response.data.data;
          }
        } catch (error) {
          // Continue to fallback
        }
      }
    }
  } catch (error) {
    // Continue to fallback
  }

  // Fallback: try fetching all topics (this is less efficient, but works)
  // Note: This fallback requires a chapterId, so it may not work perfectly
  // For now, we'll return null if we can't find by ID
  return null;
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
        (sub) =>
          sub.status && sub.status.toLowerCase() === STATUS.ACTIVE.toLowerCase()
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

  const isServer = typeof window === "undefined";
  const baseUrl = getBaseUrl();

  try {
    // Try by ID first (only if it looks like an ObjectId)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(subTopicId);
    if (isObjectId) {
      if (isServer) {
        // Server-side: use fetch
        try {
          const response = await fetch(
            `${baseUrl}/api/subtopic/${subTopicId}`,
            {
              next: { revalidate: 60 },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              return data.data;
            }
          }
        } catch (err) {
          // Continue to fallback
        }
      } else {
        // Client-side: use axios
        try {
          const response = await api.get(`/subtopic/${subTopicId}`);
          if (response.data.success && response.data.data) {
            return response.data.data;
          }
        } catch (error) {
          // Continue to fallback
        }
      }
    }
  } catch (error) {
    // Continue to fallback
  }

  // Fallback: try fetching all subtopics (this is less efficient, but works)
  // Note: This fallback requires a topicId, so it may not work perfectly
  // For now, we'll return null if we can't find by ID
  return null;
};

// ========== DETAILS FETCHING FUNCTIONS ==========
// These functions fetch Details (content and SEO fields) separately from main entities

// Fetch exam details (content, title, metaDescription, keywords)
export const fetchExamDetailsById = async (examId) => {
  if (!examId) return null;

  const isServer = typeof window === "undefined";
  const baseUrl = getBaseUrl();

  try {
    if (isServer) {
      const response = await fetch(`${baseUrl}/api/exam/${examId}/details`, {
        next: { revalidate: 60 },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
      // If no details exist, return defaults
      return {
        content: "",
        title: "",
        metaDescription: "",
        keywords: "",
      };
    } else {
      try {
        const response = await api.get(`/exam/${examId}/details`);
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
      } catch (error) {
        // If no details exist, return defaults
      }
      return {
        content: "",
        title: "",
        metaDescription: "",
        keywords: "",
      };
    }
  } catch (error) {
    logger.warn("Error fetching exam details:", error);
    return {
      content: "",
      title: "",
      metaDescription: "",
      keywords: "",
    };
  }
};

// Fetch subject details
export const fetchSubjectDetailsById = async (subjectId) => {
  if (!subjectId) return null;

  const isServer = typeof window === "undefined";
  const baseUrl = getBaseUrl();

  try {
    if (isServer) {
      const response = await fetch(`${baseUrl}/api/subject/${subjectId}/details`, {
        next: { revalidate: 60 },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
      return {
        content: "",
        title: "",
        metaDescription: "",
        keywords: "",
      };
    } else {
      try {
        const response = await api.get(`/subject/${subjectId}/details`);
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
      } catch (error) {
        // If no details exist, return defaults
      }
      return {
        content: "",
        title: "",
        metaDescription: "",
        keywords: "",
      };
    }
  } catch (error) {
    logger.warn("Error fetching subject details:", error);
    return {
      content: "",
      title: "",
      metaDescription: "",
      keywords: "",
    };
  }
};

// Fetch unit details
export const fetchUnitDetailsById = async (unitId) => {
  if (!unitId) return null;

  const isServer = typeof window === "undefined";
  const baseUrl = getBaseUrl();

  try {
    if (isServer) {
      const response = await fetch(`${baseUrl}/api/unit/${unitId}/details`, {
        next: { revalidate: 60 },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
      return {
        content: "",
        title: "",
        metaDescription: "",
        keywords: "",
      };
    } else {
      try {
        const response = await api.get(`/unit/${unitId}/details`);
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
      } catch (error) {
        // If no details exist, return defaults
      }
      return {
        content: "",
        title: "",
        metaDescription: "",
        keywords: "",
      };
    }
  } catch (error) {
    logger.warn("Error fetching unit details:", error);
    return {
      content: "",
      title: "",
      metaDescription: "",
      keywords: "",
    };
  }
};

// Fetch chapter details
export const fetchChapterDetailsById = async (chapterId) => {
  if (!chapterId) return null;

  const isServer = typeof window === "undefined";
  const baseUrl = getBaseUrl();

  try {
    if (isServer) {
      const response = await fetch(`${baseUrl}/api/chapter/${chapterId}/details`, {
        next: { revalidate: 60 },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
      return {
        content: "",
        title: "",
        metaDescription: "",
        keywords: "",
      };
    } else {
      try {
        const response = await api.get(`/chapter/${chapterId}/details`);
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
      } catch (error) {
        // If no details exist, return defaults
      }
      return {
        content: "",
        title: "",
        metaDescription: "",
        keywords: "",
      };
    }
  } catch (error) {
    logger.warn("Error fetching chapter details:", error);
    return {
      content: "",
      title: "",
      metaDescription: "",
      keywords: "",
    };
  }
};

// Fetch topic details
export const fetchTopicDetailsById = async (topicId) => {
  if (!topicId) return null;

  const isServer = typeof window === "undefined";
  const baseUrl = getBaseUrl();

  try {
    if (isServer) {
      const response = await fetch(`${baseUrl}/api/topic/${topicId}/details`, {
        next: { revalidate: 60 },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
      return {
        content: "",
        title: "",
        metaDescription: "",
        keywords: "",
      };
    } else {
      try {
        const response = await api.get(`/topic/${topicId}/details`);
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
      } catch (error) {
        // If no details exist, return defaults
      }
      return {
        content: "",
        title: "",
        metaDescription: "",
        keywords: "",
      };
    }
  } catch (error) {
    logger.warn("Error fetching topic details:", error);
    return {
      content: "",
      title: "",
      metaDescription: "",
      keywords: "",
    };
  }
};

// Fetch subtopic details
export const fetchSubTopicDetailsById = async (subTopicId) => {
  if (!subTopicId) return null;

  const isServer = typeof window === "undefined";
  const baseUrl = getBaseUrl();

  try {
    if (isServer) {
      const response = await fetch(`${baseUrl}/api/subtopic/${subTopicId}/details`, {
        next: { revalidate: 60 },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
      return {
        content: "",
        title: "",
        metaDescription: "",
        keywords: "",
      };
    } else {
      try {
        const response = await api.get(`/subtopic/${subTopicId}/details`);
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
      } catch (error) {
        // If no details exist, return defaults
      }
      return {
        content: "",
        title: "",
        metaDescription: "",
        keywords: "",
      };
    }
  } catch (error) {
    logger.warn("Error fetching subtopic details:", error);
    return {
      content: "",
      title: "",
      metaDescription: "",
      keywords: "",
    };
  }
};

// Re-export slug utilities for backward compatibility
export const createSlug = createSlugUtil;
export const findByIdOrSlug = findByIdOrSlugUtil;
