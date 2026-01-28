import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiCheckCircle } from 'react-icons/fi';
import { MdCheckCircle, MdCancel, MdPending, MdDelete } from 'react-icons/md';
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
    const [attendanceFilter, setAttendanceFilter] = useState('all'); // 'all', 'present', 'absent'

    useEffect(() => {
        fetchParticipants();
    }, [statusFilter]);

    const navigate = useNavigate();

    const fetchParticipants = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }
            const response = await axios.get('/admin/participants', { params });
            setParticipants(response.data.data);
        } catch (error) {
            console.error('Error fetching participants:', error);
        } finally {
            setLoading(false);
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
                            transition={{ delay: index * 0.05 }}
                        >
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
                </div>
            )}
        </div>
    );
};

export default ParticipantsPage;
