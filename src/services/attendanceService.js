import axios from '../lib/axios';

// Get overall attendance
export const getOverallAttendance = async (params = {}) => {
    const response = await axios.get('/admin/attendance/overall', { params });
    return response.data;
};

// Mark overall attendance
export const markOverallAttendance = async (participantIds, isPresent) => {
    const response = await axios.post('/admin/attendance/overall/mark', {
        participantIds,
        isPresent
    });
    return response.data;
};

// Get sub-event attendance
export const getSubEventAttendance = async (subEventId, params = {}) => {
    const response = await axios.get(`/admin/attendance/subevent/${subEventId}`, { params });
    return response.data;
};

// Mark sub-event attendance
export const markSubEventAttendance = async (subEventId, participantIds, isPresent) => {
    const response = await axios.post(`/admin/attendance/subevent/${subEventId}/mark`, {
        participantIds,
        isPresent
    });
    return response.data;
};

// Bulk mark attendance
export const bulkMarkAttendance = async (type, isPresent, subEventId = null) => {
    const response = await axios.post('/admin/attendance/bulk', {
        type,
        isPresent,
        subEventId
    });
    return response.data;
};

// Export attendance as PDF
export const exportAttendancePDF = async (type, subEventId = null) => {
    const params = new URLSearchParams({ type });
    if (subEventId) params.append('subEventId', subEventId);

    const response = await axios.get(`/admin/attendance/export/pdf?${params.toString()}`, {
        responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance-${type}-${Date.now()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

// Export attendance as CSV
export const exportAttendanceCSV = async (type, subEventId = null) => {
    const params = new URLSearchParams({ type });
    if (subEventId) params.append('subEventId', subEventId);

    const response = await axios.get(`/admin/attendance/export/csv?${params.toString()}`, {
        responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance-${type}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

// Export attendance as HTML
export const exportAttendanceHTML = async (type, subEventId = null) => {
    const params = new URLSearchParams({ type });
    if (subEventId) params.append('subEventId', subEventId);

    const response = await axios.get(`/admin/attendance/export/html?${params.toString()}`);

    // For HTML, we can open a new window and write the content
    const newWindow = window.open('', '_blank');
    if (newWindow) {
        newWindow.document.write(response.data);
        newWindow.document.close();
    } else {
        alert('Please allow popups to view the HTML report');
    }
};
