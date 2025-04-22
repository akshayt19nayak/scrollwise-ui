import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000'; // Update this with your actual backend URL

export const api = {
    saveBookmark: async (text: string, title?: string, collectionId?: number, tagIds?: number[]) => {
        const response = await axios.post(`${API_BASE_URL}/api/bookmarks`, {
            text,
            title,
            collection_id: collectionId,
            tag_ids: tagIds
        });
        return response.data;
    },

    getBookmark: async (id: number) => {
        const response = await axios.get(`${API_BASE_URL}/api/bookmarks/${id}`);
        return response.data;
    },

    getAllBookmarks: async () => {
        const response = await axios.get(`${API_BASE_URL}/api/bookmarks`);
        return response.data;
    },

    updateBookmark: async (id: number, title?: string, collectionId?: number, tagIds?: number[]) => {
        const response = await axios.put(`${API_BASE_URL}/api/bookmarks/${id}`, {
            title,
            collection_id: collectionId,
            tag_ids: tagIds
        });
        return response.data;
    },

    getCollections: async () => {
        const response = await axios.get(`${API_BASE_URL}/api/collections`);
        return response.data;
    },

    createCollection: async (name: string) => {
        const response = await axios.post(`${API_BASE_URL}/api/collections`, { name });
        return response.data;
    },

    getTags: async () => {
        const response = await axios.get(`${API_BASE_URL}/api/tags`);
        return response.data;
    },

    createTag: async (name: string) => {
        const response = await axios.post(`${API_BASE_URL}/api/tags`, { name });
        return response.data;
    },

    getBookmarksByTag: async (tagId: number) => {
        const response = await axios.get(`${API_BASE_URL}/api/tags/${tagId}/bookmarks`);
        return response.data;
    },

    getBookmarksByCollection: async (collectionId: number) => {
        const response = await axios.get(`${API_BASE_URL}/api/collections/${collectionId}/bookmarks`);
        return response.data;
    }
};

export const saveBookmarkSummary = async (bookmarkId: number): Promise<{ id: number; summary: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/bookmarks/${bookmarkId}/summary`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        throw new Error('Failed to save summary');
    }

    return response.json();
};

export const getBookmarkSummary = async (bookmarkId: number): Promise<{ summary: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/bookmarks/${bookmarkId}/summary`);

    if (!response.ok) {
        throw new Error('Failed to get summary');
    }

    return response.json();
}; 