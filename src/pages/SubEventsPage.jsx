import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MdAdd, MdEdit, MdDelete, MdLocationOn, MdRefresh,
    MdPeople, MdEvent, MdSettings, MdToggleOn, MdToggleOff,
    MdPlayArrow, MdStop
} from 'react-icons/md';
import Loader from '../components/ui/Loader';
import { FiSearch } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import axios from '../lib/axios';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const SubEventsPage = () => {
    const [subEvents, setSubEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'individual',
        maxParticipants: '',
        registrationDeadline: '',
        startTime: '',
        accentColor: 'mindSaga',
        registrationPrice: 50
    });

    useEffect(() => {
        fetchSubEvents();
    }, []);

    const fetchSubEvents = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/admin/subevents');
            setSubEvents(response.data.data);
        } catch (error) {
            console.error('Error fetching sub-events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (eventId) => {
        try {
            const response = await axios.put(`/admin/subevents/${eventId}/toggle`);
            if (response.data.success) {
                setSubEvents(subEvents.map(ev =>
                    ev._id === eventId ? { ...ev, isActiveForRegistration: !ev.isActiveForRegistration } : ev
                ));
                toast.success('Status updated successfully');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to toggle status');
        }
    };

    const handleStartEvent = async (eventId, eventName) => {
        try {
            const response = await axios.post(`/admin/subevents/${eventId}/start`);
            if (response.data.success) {
                setSubEvents(subEvents.map(ev =>
                    ev._id === eventId ? response.data.data : ev
                ));
                toast.success(`${eventName} has been started!`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to start event');
        }
    };

    const handleStopEvent = async (eventId, eventName) => {
        if (!window.confirm(`Are you sure you want to stop "${eventName}"? This will mark it as completed.`)) return;
        try {
            const response = await axios.post(`/admin/subevents/${eventId}/stop`);
            if (response.data.success) {
                setSubEvents(subEvents.map(ev =>
                    ev._id === eventId ? response.data.data : ev
                ));
                toast.success(`${eventName} has been stopped`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to stop event');
        }
    };

    const handleRestartEvent = async (eventId, eventName) => {
        if (!window.confirm(`Are you sure you want to restart "${eventName}"? All status will be reset to Not Started.`)) return;
        try {
            const response = await axios.post(`/admin/subevents/${eventId}/restart`);
            if (response.data.success) {
                setSubEvents(subEvents.map(ev =>
                    ev._id === eventId ? response.data.data : ev
                ));
                toast.success(`${eventName} has been reset to not started`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to restart event');
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete.id) return;
        try {
            const response = await axios.delete(`/admin/subevents/${confirmDelete.id}`);
            if (response.data.success) {
                setSubEvents(subEvents.filter(ev => ev._id !== confirmDelete.id));
                toast.success('Sub-event deleted');
                setConfirmDelete({ show: false, id: null });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete sub-event');
        }
    };

    const handleEdit = (event) => {
        setEditingEvent(event);
        setFormData({
            name: event.name,
            description: event.description,
            type: event.type,
            maxParticipants: event.maxParticipants || '',
            registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().split('T')[0] : '',
            startTime: event.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : '',
            accentColor: event.accentColor,
            registrationPrice: event.registrationPrice || 50
        });
        setShowCreateModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const payload = { ...formData };
            if (payload.maxParticipants === '') delete payload.maxParticipants;

            let response;
            if (editingEvent) {
                response = await axios.put(`/admin/subevents/${editingEvent._id}`, payload);
            } else {
                response = await axios.post('/admin/subevents', payload);
            }

            if (response.data.success) {
                toast.success(`Sub-event ${editingEvent ? 'updated' : 'created'} successfully!`);
                fetchSubEvents();
                setShowCreateModal(false);
                setEditingEvent(null);
                setFormData({
                    name: '',
                    description: '',
                    type: 'individual',
                    maxParticipants: '',
                    registrationDeadline: '',
                    startTime: '',
                    accentColor: 'mindSaga',
                    registrationPrice: 50
                });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save sub-event');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredEvents = subEvents.filter(event =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getAccentColorClass = (color) => {
        const colors = {
            mindSaga: 'bg-mindSaga-600',
            gd: 'bg-gd-600',
            debate: 'bg-debate-600'
        };
        return colors[color] || 'bg-mindSaga-600';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                        Sub-Events
                    </h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">
                        Manage event configuration and settings
                    </p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => {
                        setEditingEvent(null);
                        setFormData({
                            name: '',
                            description: '',
                            type: 'individual',
                            maxParticipants: '',
                            registrationDeadline: '',
                            startTime: '',
                            accentColor: 'mindSaga',
                            registrationPrice: 50
                        });
                        setShowCreateModal(true);
                    }}
                    className="w-full sm:w-auto"
                >
                    <MdAdd className="w-5 h-5" />
                    Create Sub-Event
                </Button>
            </div>

            {/* Search Bar */}
            <Card className="p-4">
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)] w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search sub-events..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-mindSaga-500"
                    />
                </div>
            </Card>

            {/* Sub-Events Grid */}
            {loading ? (
                <Loader message="Loading sub-events..." />
            ) : filteredEvents.length === 0 ? (
                <Card className="p-12 text-center">
                    <p className="text-[var(--color-text-muted)]">
                        {searchTerm ? 'No sub-events found matching your search' : 'No sub-events created yet'}
                    </p>
                    {!searchTerm && (
                        <Button
                            variant="primary"
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4"
                        >
                            <MdAdd className="w-5 h-5" />
                            Create Your First Sub-Event
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredEvents.map((event, index) => (
                        <motion.div
                            key={event._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="p-6 h-full flex flex-col">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-lg ${getAccentColorClass(event.accentColor)} flex items-center justify-center`}>
                                            <span className="text-white font-bold text-lg">
                                                {event.name.charAt(0)}
                                            </span>
                                        </div>
                                        {/* Event Status Badge */}
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${event.status === 'active' ? 'bg-status-available/20 text-status-available' :
                                            event.status === 'completed' ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]' :
                                                'bg-debate-400/20 text-debate-400'
                                            }`}>
                                            {event.status === 'not_started' ? 'Not Started' : event.status}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(event)}
                                            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-smooth"
                                        >
                                            <MdEdit className="w-4 h-4 text-[var(--color-text-muted)]" />
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete({ show: true, id: event._id })}
                                            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-smooth"
                                        >
                                            <MdDelete className="w-4 h-4 text-status-busy" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                                        {event.name}
                                    </h3>
                                    <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4">
                                        {event.description}
                                    </p>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <div className="p-2 rounded-lg bg-[var(--color-bg-tertiary)]">
                                            <p className="text-[10px] text-[var(--color-text-muted)] mb-1">Type</p>
                                            <p className="text-xs font-medium text-[var(--color-text-primary)] capitalize">
                                                {event.type}
                                            </p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-[var(--color-bg-tertiary)]">
                                            <p className="text-[10px] text-[var(--color-text-muted)] mb-1">Price</p>
                                            <p className="text-xs font-medium text-[var(--color-text-primary)]">
                                                ₹{event.registrationPrice || 0}
                                            </p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-[var(--color-bg-tertiary)]">
                                            <p className="text-[10px] text-[var(--color-text-muted)] mb-1">Reg.</p>
                                            <p className="text-xs font-medium text-[var(--color-text-primary)]">
                                                {event.approvedParticipants}
                                                {event.maxParticipants && `/${event.maxParticipants}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-[var(--glass-border)] mt-4">
                                    <div className="flex items-center gap-2">
                                        <Link
                                            to={`/admin/subevents/${event._id}/manage`}
                                            className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm font-medium hover:bg-mindSaga-600 hover:text-white transition-smooth flex items-center gap-1"
                                        >
                                            <MdSettings className="w-4 h-4" />
                                            Manage
                                        </Link>
                                        <button
                                            onClick={() => handleToggleStatus(event._id)}
                                            className="flex items-center gap-2"
                                            title={event.isActiveForRegistration ? 'Registration Open' : 'Registration Closed'}
                                        >
                                            {event.isActiveForRegistration ? (
                                                <MdToggleOn className="w-7 h-7 text-status-available" />
                                            ) : (
                                                <MdToggleOff className="w-7 h-7 text-[var(--color-text-muted)]" />
                                            )}
                                        </button>
                                        {/* Start/Stop Event Buttons */}
                                        {event.status === 'not_started' && (
                                            <button
                                                onClick={() => handleStartEvent(event._id, event.name)}
                                                className="px-3 py-1.5 rounded-lg bg-status-available/20 text-status-available text-sm font-medium hover:bg-status-available hover:text-white transition-smooth flex items-center gap-1"
                                            >
                                                <MdPlayArrow className="w-4 h-4" />
                                                Start
                                            </button>
                                        )}
                                        {event.status === 'active' && (
                                            <button
                                                onClick={() => handleStopEvent(event._id, event.name)}
                                                className="px-3 py-1.5 rounded-lg bg-status-busy/20 text-status-busy text-sm font-medium hover:bg-status-busy hover:text-white transition-smooth flex items-center gap-1"
                                            >
                                                <MdStop className="w-4 h-4" />
                                                Stop
                                            </button>
                                        )}
                                        {event.status === 'completed' && (
                                            <button
                                                onClick={() => handleRestartEvent(event._id, event.name)}
                                                className="px-3 py-1.5 rounded-lg bg-mindSaga-500/20 text-mindSaga-400 text-sm font-medium hover:bg-mindSaga-500 hover:text-white transition-smooth flex items-center gap-1"
                                            >
                                                <MdRefresh className="w-4 h-4" />
                                                Restart
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-xs text-[var(--color-text-muted)] font-medium">
                                        {event.totalRegistrations} reg.
                                    </span>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-5xl"
                    >
                        <Card className="p-6 sm:p-8 relative !bg-[var(--color-bg-primary)] shadow-2xl border-none">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                            >
                                <MdAdd className="w-6 h-6 rotate-45" />
                            </button>

                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 font-display">
                                {editingEvent ? 'Edit Sub-Event' : 'Create New Sub-Event'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left Column: Basic Details */}
                                    <div className="space-y-5">
                                        <div className="border-b border-[var(--glass-border)] pb-2 mb-4 hidden md:block">
                                            <h3 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Basic Details</h3>
                                        </div>

                                        <Input
                                            label="Event Name"
                                            required
                                            className="!bg-[var(--input-bg)] !border-[var(--input-border)] !text-[var(--color-text-primary)]"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Description</label>
                                            <textarea
                                                required
                                                rows={4}
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:ring-2 focus:ring-mindSaga-500 outline-none transition-all resize-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Type</label>
                                                <select
                                                    value={formData.type}
                                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                                    className="w-full h-12 px-4 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:ring-2 focus:ring-mindSaga-500 outline-none transition-all"
                                                >
                                                    <option value="individual">Individual</option>
                                                    <option value="group">Group</option>
                                                </select>
                                            </div>
                                            <Input
                                                label="Registration Price (₹)"
                                                type="number"
                                                className="!bg-[var(--input-bg)] !border-[var(--input-border)] !text-[var(--color-text-primary)]"
                                                value={formData.registrationPrice}
                                                onChange={e => setFormData({ ...formData, registrationPrice: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Right Column: Configuration & Schedule */}
                                    <div className="space-y-5">
                                        <div className="border-b border-[var(--glass-border)] pb-2 mb-4 hidden md:block">
                                            <h3 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Configuration & Schedule</h3>
                                        </div>

                                        <Input
                                            label="Max Participants (Optional)"
                                            type="number"
                                            className="!bg-[var(--input-bg)] !border-[var(--input-border)] !text-[var(--color-text-primary)]"
                                            value={formData.maxParticipants}
                                            onChange={e => setFormData({ ...formData, maxParticipants: e.target.value })}
                                        />

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Input
                                                label="Registration Deadline"
                                                type="date"
                                                className="!bg-[var(--input-bg)] !border-[var(--input-border)] !text-[var(--color-text-primary)]"
                                                value={formData.registrationDeadline}
                                                onChange={e => setFormData({ ...formData, registrationDeadline: e.target.value })}
                                            />
                                            <Input
                                                label="Start Time"
                                                type="datetime-local"
                                                className="!bg-[var(--input-bg)] !border-[var(--input-border)] !text-[var(--color-text-primary)]"
                                                value={formData.startTime}
                                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Accent Color Theme</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['mindSaga', 'gd', 'debate'].map(color => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, accentColor: color })}
                                                        className={`py-3 rounded-xl border-2 transition-all font-medium ${formData.accentColor === color ? 'border-mindSaga-500 bg-mindSaga-500/10 text-mindSaga-600' : 'border-[var(--glass-border)] bg-[var(--input-bg)] text-[var(--color-text-muted)] hover:border-[var(--color-text-primary)]'}`}
                                                    >
                                                        <span className="capitalize text-sm">{color === 'mindSaga' ? 'Purple' : color === 'gd' ? 'Blue' : 'Green'}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4 border-t border-[var(--glass-border)]">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="flex-1 h-12 rounded-xl border-[var(--glass-border)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-1 h-12 rounded-xl shadow-lg"
                                        loading={isSubmitting}
                                    >
                                        {editingEvent ? 'Save Changes' : 'Create Sub-Event'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmDelete.show}
                onClose={() => setConfirmDelete({ show: false, id: null })}
                onConfirm={handleDelete}
                title="Delete Sub-Event"
                message="Are you sure you want to delete this sub-event? This action cannot be undone and will affect all registrations associated with it."
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
};

export default SubEventsPage;
