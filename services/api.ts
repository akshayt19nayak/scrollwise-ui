import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000'; // Update this with your actual backend URL

export const api = {
  async saveSubmission(text: string) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/submissions`, { text });
      return response.data;
    } catch (error) {
      console.error('Error saving submission:', error);
      throw error;
    }
  },

  async getSubmission(id: number) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/submissions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting submission:', error);
      throw error;
    }
  },

  async getAllSubmissions() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/submissions`);
      return response.data;
    } catch (error) {
      console.error('Error getting all submissions:', error);
      throw error;
    }
  }
}; 