import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdAdd, MdEdit, MdDelete, MdGroup, MdPerson, MdRefresh,
    MdCheckCircle, MdPending, MdClose, MdShuffle, MdNotificationsActive
} from 'react-icons/md';
import axios from '../../lib/axios';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useRoundSocket } from '../../hooks/useSocket';
import Loader from '../../components/ui/Loader';

const GroupManagement = ({ roundId, subEventId }) => {
    const [groups, setGroups] = useState([]);
    const [availableParticipants, setAvailableParticipants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [formData, setFormData] = useState({
        groupSize: 4,
        autoForm: true,
        strategy: 'random' // 'random' or 'year'
    });
    const [creationMode, setCreationMode] = useState('auto'); // 'auto' or 'manual'
    const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
    const [manualGroupName, setManualGroupName] = useState('');
    const [selectedRoundId, setSelectedRoundId] = useState(roundId);
    const [rounds, setRounds] = useState([]);
    const [showPresentOnly, setShowPresentOnly] = useState(true);
    const [selectedGroupIds, setSelectedGroupIds] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingGroupId, setEditingGroupId] = useState(null);

    useEffect(() => {
        // Update local state when prop changes
        if (roundId) {
            setSelectedRoundId(roundId);
        }
    }, [roundId]);

    useEffect(() => {
        // Fetch all rounds for the subevent to populate dropdown
        const fetchRounds = async () => {
            try {
                const res = await axios.get(`/admin/rounds/subevent/${subEventId}`);
                setRounds(res.data.data);
                if (!selectedRoundId && !roundId && res.data.data.length > 0) {
                    setSelectedRoundId(res.data.data[0]._id);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchRounds();
    }, [subEventId, roundId, selectedRoundId]);

    // Socket.IO for real-time updates
    const handleGroupFormed = useCallback((data) => {
        console.log('Group formed:', data);
        toast.success('Groups formed successfully!');
        if (selectedRoundId) fetchGroups(selectedRoundId);
    }, [selectedRoundId]);

    const handleGroupUpdated = useCallback((data) => {
        console.log('Group updated:', data);
        if (selectedRoundId) fetchGroups(selectedRoundId);
    }, [selectedRoundId]);

    const socket = useRoundSocket(selectedRoundId, {
        onGroupFormed: handleGroupFormed,
        onGroupUpdated: handleGroupUpdated
    });

    useEffect(() => {
        if (selectedRoundId) {
            fetchGroups(selectedRoundId);
            fetchAvailableParticipants(selectedRoundId);
        }
    }, [selectedRoundId]);

    const fetchGroups = async (rId) => {
        try {
            setLoading(true);
            const response = await axios.get(`/admin/groups/round/${rId}`);
            setGroups(response.data.data);
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableParticipants = useCallback(async (rId) => {
        try {
            const response = await axios.get(`/admin/rounds/${rId}`);
            const round = response.data.data;
            console.log(`Fetching participants for ${round.name} (Round ${round.roundNumber})...`);

            let participants = round.participants || [];

            // If Round 1 and no participants shortlisted yet, fetch from sub-event
            if (round.roundNumber === 1 && participants.length === 0) {
                const subEventRes = await axios.get(`/admin/subevents/${subEventId}/participants`);
                participants = subEventRes.data.data || [];
            } else if (round.roundNumber > 1 && participants.length === 0) {
                // Fetch previous round winners
                const allRoundsRes = await axios.get(`/admin/rounds/subevent/${subEventId}`);
                const allRounds = allRoundsRes.data.data;
                const prevRound = allRounds.find(r => r.roundNumber === round.roundNumber - 1);

                if (prevRound) {
                    const prevRoundRes = await axios.get(`/admin/rounds/${prevRound._id}`);
                    participants = prevRoundRes.data.data.winners || [];
                }
            }

            // Filter only available participants AND not already in a group for this round
            const assignedIds = groups.reduce((acc, g) => [...acc, ...g.participants.map(p => p._id)], []);
            let available = participants.filter(p => ['available', 'qualified'].includes(p.currentStatus) && !assignedIds.includes(p._id));

            // Apply "Present Only" filter if enabled
            if (showPresentOnly) {
                available = available.filter(p => {
                    const subEventAttendance = p.attendance?.subEvents?.find(
                        se => se.subEventId === subEventId
                    );
                    return subEventAttendance?.isPresent === true;
                });
            }

            console.log(`Round ${round.roundNumber}: Found ${available.length} truly available participants (after removing ${assignedIds.length} already in groups)`);
            setAvailableParticipants(available);
        } catch (error) {
            console.error('Failed to fetch participants:', error);
        }
    }, [subEventId, groups]);

    // Socket listeners for real-time availability
    useEffect(() => {
        if (!socket) return;

        const handleAvailabilityUpdate = () => {
            console.log('🔄 Availability update received');
            if (selectedRoundId) fetchAvailableParticipants(selectedRoundId);
        };

        socket.on('availability_update', handleAvailabilityUpdate);
        socket.on('participant:approved', handleAvailabilityUpdate);

        return () => {
            socket.off('availability_update', handleAvailabilityUpdate);
            socket.off('participant:approved', handleAvailabilityUpdate);
        };
    }, [socket, fetchAvailableParticipants, selectedRoundId]);

    // Initial fetch and round change fetch
    useEffect(() => {
        if (selectedRoundId) {
            fetchGroups(selectedRoundId);
        }
    }, [selectedRoundId]);

    // Update availability when groups or selected round changes
    useEffect(() => {
        if (selectedRoundId) {
            fetchAvailableParticipants(selectedRoundId);
        }
    }, [selectedRoundId, groups, fetchAvailableParticipants, showPresentOnly]);


    const handleAutoFormGroups = async () => {
        try {
            setLoading(true);
            const response = await axios.post('/admin/groups/auto-form', {
                subEventId,
                roundId: selectedRoundId,
                groupSize: formData.groupSize,
                strategy: formData.strategy
            });

            if (response.data.success) {
                toast.success(response.data.message);
                setShowFormModal(false);
                fetchGroups(selectedRoundId);

                // Emit socket event
                const io = socket;
                if (io) {
                    io.emit('group:formed', {
                        roundId: selectedRoundId,
                        groupCount: response.data.data.length
                    });
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to form groups');
        } finally {
            setLoading(false);
        }
    };

    const handleManualCreateGroup = async () => {
        if (selectedParticipantIds.length === 0) {
            toast.error('Please select at least one participant');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post('/admin/groups', {
                subEventId,
                roundId: selectedRoundId,
                participantIds: selectedParticipantIds,
                groupName: manualGroupName
            });

            if (response.data.success) {
                toast.success('Group created successfully!');
                setShowFormModal(false);
                setCreationMode('auto');
                setSelectedParticipantIds([]);
                setManualGroupName('');
                fetchGroups(selectedRoundId);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGroup = async (groupId) => {
        if (!window.confirm('Are you sure you want to delete this group?')) return;

        try {
            await axios.delete(`/admin/groups/${groupId}`);
            toast.success('Group deleted successfully');
            fetchGroups(selectedRoundId);
        } catch (error) {
            toast.error('Failed to delete group');
        }
    };

    const handleEditGroup = (group) => {
        setEditingGroupId(group._id);
        setManualGroupName(group.groupName);
        setSelectedParticipantIds(group.participants.map(p => p._id));
        setCreationMode('manual');
        setIsEditing(true);
        setShowFormModal(true);
    };

    const handleUpdateGroup = async () => {
        if (selectedParticipantIds.length === 0) {
            toast.error('Please select at least one participant');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.put(`/admin/groups/${editingGroupId}`, {
                groupName: manualGroupName,
                participants: selectedParticipantIds
            });

            if (response.data.success) {
                toast.success('Group updated successfully!');
                setShowFormModal(false);
                setIsEditing(false);
                setCreationMode('auto');
                setSelectedParticipantIds([]);
                setManualGroupName('');
                fetchGroups(selectedRoundId);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update group');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        if (selectedGroupIds.length === 0) {
            toast.error('Please select at least one group to export');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const url = `${import.meta.env.VITE_API_URL || 'https://verbafest-dummy.onrender.com/api'}/admin/groups/export/${format}?groupIds=${selectedGroupIds.join(',')}`;

            if (format === 'html') {
                const response = await axios.get(`/admin/groups/export/html?groupIds=${selectedGroupIds.join(',')}`);
                const blob = new Blob([response.data], { type: 'text/html' });
                const blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, '_blank');
            } else {
                // For PDF, we might want to handle it with a proper download link
                const response = await axios.get(`/admin/groups/export/pdf?groupIds=${selectedGroupIds.join(',')}`, {
                    responseType: 'blob'
                });
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = `groups-export-${Date.now()}.pdf`;
                link.click();
            }
            toast.success('Export started');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export groups');
        }
    };

    const toggleGroupSelection = (groupId) => {
        setSelectedGroupIds(prev =>
            prev.includes(groupId)
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedGroupIds.length === groups.length) {
            setSelectedGroupIds([]);
        } else {
            setSelectedGroupIds(groups.map(g => g._id));
        }
    };

    const handleSendNotification = async (groupId) => {
        try {
            setLoading(true);
            const response = await axios.post(`/admin/groups/${groupId}/notify`);
            toast.success(response.data.message, { icon: '🔔' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send notification');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'text-status-available';
            case 'in_progress':
                return 'text-debate-400';
            default:
                return 'text-[var(--color-text-muted)]';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <MdCheckCircle className="w-5 h-5" />;
            case 'in_progress':
                return <MdPending className="w-5 h-5" />;
            default:
                return <MdPending className="w-5 h-5" />;
        }
    };

    if (!selectedRoundId && !roundId) {
        return (
            <Card className="p-12 text-center border-dashed border-2 border-[var(--glass-border)]">
                <MdGroup className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                    No Round Selected
                </h3>
                <p className="text-[var(--color-text-muted)]">
                    Please create or select a round from the control room to manage groups.
                </p>
            </Card>
        );
    }

    if (loading) {
        return <Loader message="Loading participant groups..." />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                        Groups Management
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {availableParticipants.length} available participants • {groups.length} groups formed
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    <select
                        value={selectedRoundId || ''}
                        onChange={(e) => setSelectedRoundId(e.target.value)}
                        className="px-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-sm font-medium"
                    >
                        {rounds.map(r => (
                            <option key={r._id} value={r._id}>{r.name}</option>
                        ))}
                    </select>

                    <Button
                        variant="outline"
                        onClick={() => selectedRoundId && fetchGroups(selectedRoundId)}
                    >
                        <MdRefresh className="w-5 h-5" />
                        Refresh
                    </Button>
                    <div className="flex bg-[var(--color-bg-tertiary)] p-1 rounded-lg border border-[var(--glass-border)]">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="px-3"
                            onClick={() => handleExport('pdf')}
                            disabled={selectedGroupIds.length === 0}
                        >
                            PDF Export ({selectedGroupIds.length})
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="px-3"
                            onClick={() => handleExport('html')}
                            disabled={selectedGroupIds.length === 0}
                        >
                            HTML View
                        </Button>
                    </div>
                    <Button
                        onClick={() => {
                            setIsEditing(false);
                            setCreationMode('auto');
                            setShowFormModal(true);
                        }}
                    >
                        <MdShuffle className="w-5 h-5" />
                        Auto-Form Groups
                    </Button>
                </div>
            </div>

            {/* Attendance Filter Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--glass-border)] w-fit">
                    <input
                        type="checkbox"
                        id="present-only-filter"
                        checked={showPresentOnly}
                        onChange={(e) => setShowPresentOnly(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-mindSaga-600 focus:ring-mindSaga-500"
                    />
                    <label htmlFor="present-only-filter" className="text-sm font-medium text-[var(--color-text-primary)] cursor-pointer">
                        Show Only Present Participants for Grouping
                    </label>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="text-mindSaga-400"
                >
                    {selectedGroupIds.length === groups.length ? 'Deselect All' : 'Select All Groups'}
                </Button>
            </div>

            {/* Groups Grid */}
            {groups.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2">
                    <MdGroup className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4 opacity-20" />
                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                        No Groups Formed Yet
                    </h3>
                    <p className="text-[var(--color-text-muted)] mb-6">
                        Click "Auto-Form Groups" to automatically create groups based on participant availability
                    </p>
                    <Button onClick={() => setShowFormModal(true)}>
                        <MdShuffle className="w-5 h-5" />
                        Auto-Form Groups
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group, index) => (
                        <motion.div
                            key={group._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="p-6 h-full flex flex-col">
                                {/* Group Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedGroupIds.includes(group._id)}
                                            onChange={() => toggleGroupSelection(group._id)}
                                            className="w-4 h-4 rounded border-gray-300 text-mindSaga-600 focus:ring-mindSaga-500"
                                        />
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-mindSaga-600 to-debate-600 flex items-center justify-center text-white font-bold text-xl">
                                            {group.groupNumber}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[var(--color-text-primary)]">
                                                {group.groupName}
                                            </h3>
                                            <div className={`flex items-center gap-1 text-sm ${getStatusColor(group.evaluationStatus)}`}>
                                                {getStatusIcon(group.evaluationStatus)}
                                                <span className="capitalize">{group.evaluationStatus.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleEditGroup(group)}
                                            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-smooth text-mindSaga-400"
                                            title="Edit Group"
                                        >
                                            <MdEdit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteGroup(group._id)}
                                            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-smooth text-status-busy"
                                            title="Delete Group"
                                        >
                                            <MdDelete className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Participants */}
                                <div className="flex-1 space-y-2 mb-4">
                                    {group.participants?.map((participant) => (
                                        <div
                                            key={participant._id}
                                            className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-bg-tertiary)]"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-mindSaga-600 flex items-center justify-center text-white text-sm font-bold">
                                                {participant.fullName?.charAt(0) || 'P'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                                                    {participant.fullName}
                                                </p>
                                                <p className="text-xs text-[var(--color-text-muted)] truncate">
                                                    {participant.prn || participant.email}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="pt-4 border-t border-[var(--glass-border)]">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[var(--color-text-secondary)]">
                                            <MdPerson className="inline w-4 h-4 mr-1" />
                                            {group.participants?.length || 0} members
                                        </span>
                                        {group.panelId && (
                                            <span className="text-mindSaga-400">
                                                Panel Assigned
                                            </span>
                                        )}
                                        {group.averageScore > 0 && (
                                            <span className="font-bold text-status-available">
                                                {group.averageScore.toFixed(1)}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full flex items-center justify-center gap-2 border-mindSaga-500/30 text-mindSaga-400 hover:bg-mindSaga-600 hover:text-white"
                                            onClick={() => handleSendNotification(group._id)}
                                            disabled={loading || group.evaluationStatus === 'completed'}
                                        >
                                            <MdNotificationsActive className="w-4 h-4" />
                                            Notify Members
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Auto-Form Modal */}
            <AnimatePresence>
                {showFormModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                                        Create Groups
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setShowFormModal(false);
                                            setIsEditing(false);
                                            setCreationMode('auto');
                                            setSelectedParticipantIds([]);
                                            setManualGroupName('');
                                        }}
                                        className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-smooth"
                                    >
                                        <MdClose className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Mode Toggle */}
                                <div className="flex p-1 bg-[var(--color-bg-tertiary)] rounded-xl mb-6">
                                    <button
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${creationMode === 'auto' ? 'bg-mindSaga-600 text-white shadow-lg' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
                                        onClick={() => {
                                            if (!isEditing) setCreationMode('auto');
                                        }}
                                        disabled={isEditing}
                                    >
                                        {isEditing ? 'Editing Group' : 'Auto-Form'}
                                    </button>
                                    {!isEditing && (
                                        <button
                                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${creationMode === 'manual' ? 'bg-mindSaga-600 text-white shadow-lg' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
                                            onClick={() => setCreationMode('manual')}
                                        >
                                            Manual Creation
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {creationMode === 'auto' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <div>
                                                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Grouping Preferences</h3>
                                                    <p className="text-[var(--color-text-secondary)] mb-6 text-sm">
                                                        Automatically form groups from {availableParticipants.length} available participants.
                                                    </p>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">
                                                                Group Size
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="2"
                                                                max="10"
                                                                value={formData.groupSize}
                                                                onChange={(e) => setFormData({ ...formData, groupSize: parseInt(e.target.value) })}
                                                                className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:ring-2 focus:ring-mindSaga-500 outline-none"
                                                            />
                                                            <p className="text-xs text-[var(--color-text-muted)] mt-2">
                                                                Estimated groups: {Math.ceil(availableParticipants.length / formData.groupSize)}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">
                                                                Grouping Strategy
                                                            </label>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <button
                                                                    onClick={() => setFormData({ ...formData, strategy: 'random' })}
                                                                    className={`p-4 rounded-xl border-2 transition-all text-left ${formData.strategy === 'random' ? 'border-mindSaga-500 bg-mindSaga-500/10' : 'border-[var(--glass-border)] hover:border-mindSaga-500/50'}`}
                                                                >
                                                                    <p className="font-bold text-[var(--color-text-primary)]">Random</p>
                                                                    <p className="text-xs text-[var(--color-text-muted)]">Shuffles everyone randomly</p>
                                                                </button>
                                                                <button
                                                                    onClick={() => setFormData({ ...formData, strategy: 'year' })}
                                                                    className={`p-4 rounded-xl border-2 transition-all text-left ${formData.strategy === 'year' ? 'border-mindSaga-500 bg-mindSaga-500/10' : 'border-[var(--glass-border)] hover:border-mindSaga-500/50'}`}
                                                                >
                                                                    <p className="font-bold text-[var(--color-text-primary)] text-status-available flex items-center gap-1">
                                                                        Year based
                                                                        <span className="text-[10px] bg-status-available/20 px-1 rounded">Recommended</span>
                                                                    </p>
                                                                    <p className="text-xs text-[var(--color-text-muted)]">Groups participants from same Year (FY, SY, etc.)</p>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-4 rounded-xl bg-mindSaga-600/10 border border-mindSaga-600/20">
                                                    <h4 className="font-semibold text-mindSaga-400 mb-2">Grouping Intelligence:</h4>
                                                    <ul className="text-sm text-[var(--color-text-secondary)] space-y-2">
                                                        <li className="flex items-start gap-2">
                                                            <span className="text-mindSaga-500 font-bold">•</span>
                                                            <span>Strict year boundaries for fair competition</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <span className="text-mindSaga-500 font-bold">•</span>
                                                            <span>Remaining participants (less than min size) are distributed into existing groups of same category</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <span className="text-mindSaga-500 font-bold">•</span>
                                                            <span>Only approved/available participants are included</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="font-bold text-[var(--color-text-primary)]">Preview Participants</h4>
                                                <div className="bg-[var(--color-bg-tertiary)] rounded-2xl p-4 max-h-[300px] overflow-y-auto border border-[var(--glass-border)]">
                                                    <div className="space-y-2">
                                                        {availableParticipants.sort((a, b) => a.year - b.year).map(p => (
                                                            <div key={p._id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--glass-border)]">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-mindSaga-600 flex items-center justify-center text-white text-xs font-bold">
                                                                        {p.fullName.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-bold truncate max-w-[150px]">{p.fullName}</p>
                                                                        <p className="text-[10px] text-[var(--color-text-muted)]">PRN: {p.prn || 'N/A'}</p>
                                                                    </div>
                                                                </div>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.year == 1 ? 'bg-blue-500/20 text-blue-400' : p.year == 2 ? 'bg-purple-500/20 text-purple-400' : p.year == 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                                                                    {p.year == 1 ? 'FY' : p.year == 2 ? 'SY' : p.year == 3 ? 'TY' : p.year == 4 ? 'LY' : 'Other'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {availableParticipants.length === 0 && (
                                                            <p className="text-center py-4 text-[var(--color-text-muted)] italic">No participants available</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">
                                                    Group Name (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={manualGroupName}
                                                    onChange={(e) => setManualGroupName(e.target.value)}
                                                    placeholder="e.g. Elite Squadron"
                                                    className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:ring-2 focus:ring-mindSaga-500 outline-none"
                                                />
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">
                                                        Select Participants ({selectedParticipantIds.length} selected)
                                                    </label>
                                                    <span className="text-xs text-[var(--color-text-muted)]">
                                                        {availableParticipants.length} available
                                                    </span>
                                                </div>
                                                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                                                    {[...availableParticipants, ...(isEditing ? groups.find(g => g._id === editingGroupId)?.participants || [] : [])]
                                                        .filter((v, i, a) => a.findIndex(t => (t._id === v._id)) === i) // Unique
                                                        .map(participant => (
                                                            <button
                                                                key={participant._id}
                                                                onClick={() => {
                                                                    if (selectedParticipantIds.includes(participant._id)) {
                                                                        setSelectedParticipantIds(selectedParticipantIds.filter(id => id !== participant._id));
                                                                    } else {
                                                                        setSelectedParticipantIds([...selectedParticipantIds, participant._id]);
                                                                    }
                                                                }}
                                                                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedParticipantIds.includes(participant._id)
                                                                    ? 'bg-mindSaga-600/20 border-mindSaga-500'
                                                                    : 'bg-[var(--color-bg-secondary)] border-[var(--glass-border)]'
                                                                    }`}
                                                            >
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedParticipantIds.includes(participant._id) ? 'bg-mindSaga-600 text-white' : 'bg-[var(--color-bg-tertiary)]'}`}>
                                                                    {participant.fullName.charAt(0)}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-bold truncate">{participant.fullName}</p>
                                                                    <p className="text-[10px] text-[var(--color-text-muted)] truncate">{participant.prn || participant.chestNumber}</p>
                                                                </div>
                                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${selectedParticipantIds.includes(participant._id) ? 'bg-mindSaga-600 border-mindSaga-500' : 'border-[var(--glass-border)]'}`}>
                                                                    {selectedParticipantIds.includes(participant._id) && <MdCheckCircle className="text-white w-4 h-4" />}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    {availableParticipants.length === 0 && (
                                                        <p className="text-center py-8 text-[var(--color-text-muted)] italic text-sm">
                                                            No available participants to select.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <Button
                                            variant="secondary"
                                            className="flex-1"
                                            onClick={() => {
                                                setShowFormModal(false);
                                                setIsEditing(false);
                                                setCreationMode('auto');
                                                setSelectedParticipantIds([]);
                                                setManualGroupName('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="primary"
                                            className="flex-1"
                                            onClick={isEditing ? handleUpdateGroup : (creationMode === 'auto' ? handleAutoFormGroups : handleManualCreateGroup)}
                                            disabled={loading || (creationMode === 'manual' && selectedParticipantIds.length === 0)}
                                        >
                                            {loading ? (
                                                <span className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    {creationMode === 'auto' ? 'Forming...' : 'Creating...'}
                                                </span>
                                            ) : (
                                                <>
                                                    {creationMode === 'auto' ? <MdShuffle className="w-5 h-5" /> : (isEditing ? <MdEdit className="w-5 h-5" /> : <MdAdd className="w-5 h-5" />)}
                                                    {isEditing ? 'Update Group' : (creationMode === 'auto' ? 'Form Groups' : 'Create Group')}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GroupManagement;
