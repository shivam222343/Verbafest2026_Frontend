import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiCheckCircle, FiDownload } from 'react-icons/fi';
import { MdCheckCircle, MdCancel, MdPending, MdDelete, MdClose } from 'react-icons/md';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';

const ParticipantsPage = () => {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [attendanceFilter, setAttendanceFilter] = useState('all');
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 50
    });

    // Export State
    const [showExportModal, setShowExportModal] = useState(false);
    const [subEvents, setSubEvents] = useState([]);
    const [selectedExportSubEvents, setSelectedExportSubEvents] = useState(['all']);
    const [exportFormat, setExportFormat] = useState('csv');
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        fetchParticipants(1);
        fetchSubEvents();
    }, [statusFilter]);

    const navigate = useNavigate();

    const fetchParticipants = async (page = pagination.currentPage) => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: pagination.limit
            };
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }
            const response = await axios.get('/admin/participants', { params });
            setParticipants(response.data.data);
            setPagination(prev => ({
                ...prev,
                currentPage: response.data.currentPage,
                totalPages: response.data.totalPages,
                totalCount: response.data.count
            }));
        } catch (error) {
            console.error('Error fetching participants:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubEvents = async () => {
        try {
            const response = await axios.get('/admin/subevents');
            setSubEvents(response.data.data);
        } catch (error) {
            console.error('Error fetching sub-events:', error);
        }
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const token = localStorage.getItem('token');
            const subEventsParam = selectedExportSubEvents.includes('all') ? 'all' : selectedExportSubEvents.join(',');
            const statusParam = statusFilter === 'all' ? '' : statusFilter;

            const exportUrl = `${axios.defaults.baseURL}/admin/participants/export?format=${exportFormat}&subEvents=${subEventsParam}&status=${statusParam}`;

            const response = await fetch(exportUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `participants-export-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('List exported successfully');
            setShowExportModal(false);
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export participants');
        } finally {
            setIsExporting(false);
        }
    };

    const filteredParticipants = participants.filter(participant => {
        const matchesSearch = participant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            participant.prn.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesAttendance = attendanceFilter === 'all' ||
            (attendanceFilter === 'present' ? participant.attendance?.overall?.isPresent : !participant.attendance?.overall?.isPresent);

        return matchesSearch && matchesAttendance;
    });

    const getStatusBadge = (status) => {
        const badges = {
            approved: { icon: MdCheckCircle, color: 'status-available', text: 'Approved' },
            pending: { icon: MdPending, color: 'debate', text: 'Pending' },
            rejected: { icon: MdCancel, color: 'status-busy', text: 'Rejected' },
            incomplete: { icon: MdPending, color: 'gray-500', text: 'Incomplete' }
        };
        const badge = badges[status] || badges.pending;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-${badge.color}/20 text-${badge.color} text-sm font-medium`}>
                <Icon className="w-4 h-4" />
                {badge.text}
            </span>
        );
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await axios.put(`/admin/participants/${id}/registration-status`, { status });
            toast.success(`Status updated to ${status}`);
            fetchParticipants();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this participant? This action cannot be undone.')) return;
        try {
            await axios.delete(`/admin/participants/${id}`);
            toast.success('Participant deleted successfully');
            fetchParticipants();
        } catch (error) {
            toast.error('Failed to delete participant');
        }
    };

    const stats = {
        total: participants.length,
        approved: participants.filter(p => p.registrationStatus === 'approved').length,
        pending: participants.filter(p => p.registrationStatus === 'pending').length,
        rejected: participants.filter(p => p.registrationStatus === 'rejected').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                    Participants
                </h1>
                <p className="text-[var(--color-text-secondary)] mt-1">
                    Manage participant registrations and approvals
                </p>
            </div>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center gap-2"
                >
                    <FiDownload className="w-4 h-4" />
                    Export List
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">Total</p>
                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.total}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">Approved</p>
                    <p className="text-2xl font-bold text-status-available">{stats.approved}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">Pending</p>
                    <p className="text-2xl font-bold text-debate-600">{stats.pending}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">Rejected</p>
                    <p className="text-2xl font-bold text-status-busy">{stats.rejected}</p>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)] w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or PRN..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-mindSaga-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <FiFilter className="w-5 h-5 text-[var(--color-text-muted)]" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-mindSaga-500"
                        >
                            <option value="all">All Status</option>
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    {/* Attendance Filter */}
                    <div className="flex items-center gap-2">
                        <FiCheckCircle className="w-5 h-5 text-[var(--color-text-muted)]" />
                        <select
                            value={attendanceFilter}
                            onChange={(e) => setAttendanceFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-mindSaga-500"
                        >
                            <option value="all">All Attendance</option>
                            <option value="present">Present Only</option>
                            <option value="absent">Absent Only</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Participants List */}
            {loading ? (
                <Loader message="Fetching participants database..." />
            ) : filteredParticipants.length === 0 ? (
                <Card className="p-12 text-center">
                    <p className="text-[var(--color-text-muted)]">
                        {searchTerm ? 'No participants found matching your search' : 'No participants yet'}
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredParticipants.map((participant, index) => (
                        <motion.div
                            key={participant._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                        >
                            {/* ... Participant Card content (no changes needed inside map) ... */}
                            <Card className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    {/* Participant Info */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-lg bg-debate-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                                    {participant.chestNumber || '?'}
                                                </span>
                                                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                                    {participant.fullName}
                                                </h3>
                                            </div>
                                            {getStatusBadge(participant.registrationStatus)}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                                            <p className="text-[var(--color-text-secondary)]">
                                                <span className="text-[var(--color-text-muted)]">Email:</span> {participant.email}
                                            </p>
                                            <p className="text-[var(--color-text-secondary)]">
                                                <span className="text-[var(--color-text-muted)]">PRN:</span> {participant.prn}
                                            </p>
                                            <p className="text-[var(--color-text-secondary)]">
                                                <span className="text-[var(--color-text-muted)]">Mobile:</span> {participant.mobile}
                                            </p>
                                            <p className="text-[var(--color-text-secondary)]">
                                                <span className="text-[var(--color-text-muted)]">Branch:</span> {participant.branch}
                                            </p>
                                            <p className="text-[var(--color-text-secondary)]">
                                                <span className="text-[var(--color-text-muted)]">Year:</span> {participant.year}
                                            </p>
                                            <p className="text-[var(--color-text-secondary)]">
                                                <span className="text-[var(--color-text-muted)]">College:</span> {participant.college}
                                            </p>
                                        </div>
                                        {participant.registeredSubEvents && participant.registeredSubEvents.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {participant.registeredSubEvents.map((event) => (
                                                    <span
                                                        key={event._id}
                                                        className="px-2 py-1 rounded-md bg-mindSaga-600/20 text-mindSaga-400 text-xs font-medium"
                                                    >
                                                        {event.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={participant.registrationStatus}
                                            onChange={(e) => handleStatusUpdate(participant._id, e.target.value)}
                                            className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--glass-border)] text-sm focus:outline-none"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="incomplete">Incomplete</option>
                                        </select>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate(`/admin/participants/${participant._id}`)}
                                        >
                                            Profile
                                        </Button>
                                        <button
                                            onClick={() => handleDelete(participant._id)}
                                            className="p-2 rounded-lg hover:bg-status-busy/20 text-status-busy transition-smooth"
                                            title="Delete Participant"
                                        >
                                            <MdDelete className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}

                    {/* Pagination Controls */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-8 pb-8">
                            <Button
                                variant="outline"
                                onClick={() => fetchParticipants(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => fetchParticipants(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-lg"
                    >
                        <Card className="p-6 relative !bg-[var(--color-bg-primary)] shadow-2xl border-none">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                            >
                                <MdClose className="w-6 h-6" />
                            </button>

                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
                                <FiDownload className="w-6 h-6 text-mindSaga-500" />
                                Export Participants
                            </h2>
                            <p className="text-[var(--color-text-secondary)] text-sm mb-6">
                                Generate a detailed report of participants in your preferred format.
                            </p>

                            <div className="space-y-6">
                                {/* Sub-Event Selection */}
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Select Sub-Events</label>
                                    <div className="max-h-48 overflow-y-auto p-3 rounded-xl border border-[var(--glass-border)] bg-[var(--color-bg-tertiary)] space-y-2">
                                        <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={selectedExportSubEvents.includes('all')}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedExportSubEvents(['all']);
                                                    else setSelectedExportSubEvents([]);
                                                }}
                                                className="w-4 h-4 rounded border-[var(--glass-border)] text-mindSaga-600 focus:ring-mindSaga-500"
                                            />
                                            <span className="text-sm font-medium text-[var(--color-text-primary)]">All Sub-Events</span>
                                        </label>
                                        <div className="h-px bg-[var(--glass-border)] my-1" />
                                        {subEvents.map(event => (
                                            <label key={event._id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedExportSubEvents.includes(event._id)}
                                                    onChange={(e) => {
                                                        const newSelection = selectedExportSubEvents.filter(id => id !== 'all');
                                                        if (e.target.checked) {
                                                            setSelectedExportSubEvents([...newSelection, event._id]);
                                                        } else {
                                                            setSelectedExportSubEvents(newSelection.filter(id => id !== event._id));
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded border-[var(--glass-border)] text-mindSaga-600 focus:ring-mindSaga-500"
                                                />
                                                <span className="text-sm text-[var(--color-text-primary)]">{event.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Format Selection */}
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Export Format</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setExportFormat('csv')}
                                            className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${exportFormat === 'csv' ? 'border-mindSaga-500 bg-mindSaga-500/10 text-mindSaga-600' : 'border-[var(--glass-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:border-[var(--color-text-primary)]'}`}
                                        >
                                            <span className="font-bold">CSV / Excel</span>
                                        </button>
                                        <button
                                            onClick={() => setExportFormat('html')}
                                            className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${exportFormat === 'html' ? 'border-mindSaga-500 bg-mindSaga-500/10 text-mindSaga-600' : 'border-[var(--glass-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:border-[var(--color-text-primary)]'}`}
                                        >
                                            <span className="font-bold">HTML Webpage</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3 bg-mindSaga-500/5 rounded-lg border border-mindSaga-500/10">
                                    <p className="text-[10px] text-mindSaga-400 font-bold uppercase tracking-wider">Filtered By Current Status</p>
                                    <p className="text-xs text-[var(--color-text-secondary)]">Currently active filter: <span className="font-bold capitalize">{statusFilter}</span></p>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-4">
                                <Button
                                    variant="secondary"
                                    className="flex-1 h-12 rounded-xl"
                                    onClick={() => setShowExportModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    className="flex-1 h-12 rounded-xl shadow-lg"
                                    loading={isExporting}
                                    disabled={selectedExportSubEvents.length === 0}
                                    onClick={handleExport}
                                >
                                    Start Export
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ParticipantsPage;
