import axios from '../lib/axios';

/**
 * Get all sub-events
 * @returns {Promise}
 */
export const getSubEvents = async () => {
    try {
        const response = await axios.get('/admin/subevents');
        return response.data;
    } catch (error) {
        console.error('Error fetching sub-events:', error);
        throw error;
    }
};

/**
 * Get a single sub-event by ID
 * @param {string} id 
 * @returns {Promise}
 */
export const getSubEventById = async (id) => {
    try {
        const response = await axios.get(`/admin/subevents/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching sub-event ${id}:`, error);
        throw error;
    }
};

/**
 * Get participants for a specific sub-event
 * @param {string} id 
 * @returns {Promise}
 */
export const getSubEventParticipants = async (id) => {
    try {
        const response = await axios.get(`/admin/subevents/${id}/participants`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching participants for sub-event ${id}:`, error);
        throw error;
    }
};
