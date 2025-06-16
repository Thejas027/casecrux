import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/summaries"; // Adjusted base

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor for handling API errors globally (optional, but good practice)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error or show a generic error message to the user
    console.error("API call failed:", error.response || error.message);
    // You could throw the error to be caught by the component or handle it here
    // For example, by showing a toast notification
    return Promise.reject(
      error.response ? error.response.data : { message: error.message }
    );
  }
);

// --- Summaries API ---

export const uploadPdf = async (file, caseId) => {
  const formData = new FormData();
  formData.append("file", file);
  if (caseId) {
    formData.append("caseId", caseId); // Ensure your backend individualSummaryController expects caseId for single uploads if used
  }
  return apiClient.post("/individual/upload", formData, {
    // CORRECTED
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getAllUniqueSummaries = async () => {
  return apiClient.get("/individual"); // CORRECTED
};

export const deleteIndividualSummary = async (summaryId) => {
  return apiClient.delete(`/individual/${summaryId}`); // CORRECTED
};

export const getSummaryById = async (id) => {
  try {
    const response = await apiClient.get(`/individual/${id}`); // CORRECTED
    if (response.data) {
      return response.data;
    }
  } catch (error) {
    console.error(`Error fetching summary with id ${id}:`, error);
    throw error;
  }
};

// --- Overall Summaries API ---

export const createOrUpdateOverallSummary = async (caseId) => {
  // Ensure your backend overallSummaryController expects caseId if you send it
  return apiClient.post("/overall/generate", { caseId }); // CORRECTED
};

export const getOverallSummaryHistory = async () => {
  return apiClient.get("/overall/history"); // CORRECTED
};

export const getOverallSummaryById = async (overallSummaryId) => {
  return apiClient.get(`/overall/${overallSummaryId}`); // CORRECTED
};

export const deleteOverallSummary = async (overallSummaryId) => {
  return apiClient.delete(`/overall/${overallSummaryId}`); // CORRECTED
};

// --- Multi PDF Summaries API ---
export const uploadMultiplePdfs = async (files, caseId) => {
  const formData = new FormData();
  // Ensure your backend multiDocumentController expects 'files' (plural)
  Array.from(files).forEach((file) => {
    // Make sure 'files' is iterable, e.g. from FileList
    formData.append("files", file);
  });
  formData.append("caseId", caseId);

  return apiClient.post("/multi/upload", formData, {
    // CORRECTED
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export default apiClient;
