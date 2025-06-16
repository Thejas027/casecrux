const axios = require("axios");
const FormData = require("form-data");
const config = require("../config");

/**
 * Calls the ML service with the given endpoint and payload.
 * @param {string} endpoint - The ML service endpoint (e.g., '/summarize', '/summarize_overall').
 * @param {Buffer | object} payload - The data to send. Buffer for file, object for JSON.
 * @param {string} [filename] - The original filename, required if payload is a Buffer.
 * @returns {Promise<object>} - The response data from the ML service.
 * @throws {Error} - If the ML service call fails.
 */
const callMlService = async (endpoint, payload, filename) => {
  const mlServiceBaseUrl = config.mlServiceUrl;
  const url = `${mlServiceBaseUrl}${endpoint}`;
  let response;

  try {
    if (Buffer.isBuffer(payload)) {
      if (!filename) {
        throw new Error("Filename is required for file uploads to ML service.");
      }
      const formData = new FormData();
      formData.append("file", payload, { filename });
      response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 300000, // 5 minutes timeout
      });
    } else {
      response = await axios.post(url, payload, {
        timeout: 300000, // 5 minutes timeout
      });
    }
    // The ML service for single PDF summary returns { summary: { summary: 'text', category: 'cat' } }
    // The ML service for overall summary returns { overall_summary: 'text', pros: [], cons: [] }
    // We will return the data part directly.
    return response.data;
  } catch (error) {
    console.error(`Error calling ML service at ${url}:`, error.message);
    if (error.response) {
      console.error("ML Service Response Error Data:", error.response.data);
      console.error("ML Service Response Error Status:", error.response.status);
      // Create a new error with more context
      const serviceError = new Error(
        `ML service request failed with status ${
          error.response.status
        }: ${JSON.stringify(error.response.data)}`
      );
      serviceError.status = error.response.status || 500;
      serviceError.details = error.response.data;
      throw serviceError;
    }
    // Network error or other issues
    const serviceError = new Error("Failed to connect to ML service.");
    serviceError.status = 503; // Service Unavailable
    throw serviceError;
  }
};

module.exports = { callMlService };
