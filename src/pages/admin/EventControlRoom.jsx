import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdArrowBack, MdAdd, MdSettings, MdGroups, MdPerson,
    MdCheckCircle, MdPlayArrow, MdStop, MdLocationOn, MdClose,
    MdFilterList, MdSearch, MdPeople, MdRefresh, MdTimer, MdAnalytics, MdChevronLeft, MdChevronRight, MdCheck, MdDelete, MdFileDownload
} from 'react-icons/md';
import Loader from '../../components/ui/Loader';
import toast from 'react-hot-toast';
import axios from '../../lib/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import GroupManagement from './GroupManagement';
import PanelManagement from './PanelManagement';
import EvaluationOverview from './EvaluationOverview';

const EventControlRoom = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [subEvent, setSubEvent] = useState(null);
    const [rounds, setRounds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('rounds');
    const [showAddRound, setShowAddRound] = useState(false);
    const [showShortlistModal, setShowShortlistModal] = useState(null); // Round ID
    const [eligibleParticipants, setEligibleParticipants] = useState([]);
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [searchParticipant, setSearchParticipant] = useState('');
    const [eventParticipants, setEventParticipants] = useState([]);
    const [participantsLoading, setParticipantsLoading] = useState(false);
    const [selectedRoundId, setSelectedRoundId] = useState(null);
    const [roundGroups, setRoundGroups] = useState([]);
    const [editingRound, setEditingRound] = useState(null);
    const [isDeletingRound, setIsDeletingRound] = useState(false);
    const [isUpdatingEvent, setIsUpdatingEvent] = useState(false);
    const [roundEvaluations, setRoundEvaluations] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');

    // Update selectedRoundId when rounds change or if none selected
    useEffect(() => {
        if (rounds && rounds.length > 0) {
            // If current selectedRoundId is no longer in rounds, or none selected
            if (!selectedRoundId || !rounds.find(r => r._id === selectedRoundId)) {
                const activeRound = rounds.find(r => r.status === 'active');
                setSelectedRoundId(activeRound ? activeRound._id : rounds[0]._id);
            }
        } else {
            setSelectedRoundId(null);
        }
    }, [rounds, selectedRoundId]);

    useEffect(() => {
        fetchEventDetails();
        if (activeTab === 'participants' || activeTab === 'shortlist') {
            fetchEventParticipants();
        }
    }, [id, activeTab, selectedRoundId]);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const [eventRes, roundsRes] = await Promise.all([
                axios.get(`/admin/subevents/${id}`),
                axios.get(`/admin/rounds/subevent/${id}`)
            ]);
            setSubEvent(eventRes.data.data);
            setRounds(roundsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch event details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEventParticipants = async () => {
        try {
            setParticipantsLoading(true);
            let res;
            if (selectedRoundId && selectedRoundId !== 'all') {
                const [roundRes, groupsRes, evaluationsRes] = await Promise.all([
                    axios.get(`/admin/rounds/${selectedRoundId}`),
                    axios.get(`/admin/groups/round/${selectedRoundId}`),
                    axios.get(`/admin/panels/round/${selectedRoundId}/evaluations`)
                ]);

                setEventParticipants(roundRes.data.data.participants || []);
                setRoundGroups(groupsRes.data.data || []);
                setRoundEvaluations(evaluationsRes.data.data || []);

                // If no participants shortlisted yet for this round, show eligible pool
                if (!roundRes.data.data.participants || roundRes.data.data.participants.length === 0) {
                    const currentRound = roundRes.data.data;
                    if (currentRound.roundNumber === 1) {
                        const subRes = await axios.get(`/admin/subevents/${id}/participants`);
                        setEventParticipants(subRes.data.data || []);
                    } else {
                        const prevRound = rounds.find(r => r.roundNumber === currentRound.roundNumber - 1);
                        if (prevRound) {
                            const prevRes = await axios.get(`/admin/rounds/${prevRound._id}`);
                            setEventParticipants(prevRes.data.data.winners || []);
                        }
                    }
                }
            } else {
                res = await axios.get(`/admin/subevents/${id}/participants`);
                setEventParticipants(res.data.data);
                setRoundGroups([]);
                setRoundEvaluations([]);
            }
        } catch (error) {
            console.error('Failed to fetch event participants:', error);
        } finally {
            setParticipantsLoading(false);
        }
    };

    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updateData = {
            name: formData.get('name'),
            description: formData.get('description'),
            maxParticipants: parseInt(formData.get('maxParticipants')),
            registrationPrice: parseFloat(formData.get('registrationPrice')),
            accentColor: formData.get('accentColor'),
            type: formData.get('type')
        };

        try {
            setIsUpdatingEvent(true);
            await axios.put(`/admin/subevents/${id}`, updateData);
            toast.success('Event settings updated successfully');
            fetchEventDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update event');
        } finally {
            setIsUpdatingEvent(false);
        }
    };

    const handleToggleRegistration = async () => {
        try {
            const res = await axios.put(`/admin/subevents/${id}/toggle`);
            setSubEvent({ ...subEvent, isActiveForRegistration: res.data.data.isActiveForRegistration });
            toast.success(res.data.message);
        } catch (error) {
            toast.error('Failed to toggle registration');
        }
    };

    const handleCreateRound = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const roundData = {
            subEventId: id,
            roundNumber: rounds.length + 1,
            name: formData.get('name'),
            venue: formData.get('venue'),
            instructions: formData.get('instructions'),
            isElimination: formData.get('isElimination') === 'true'
        };

        try {
            await axios.post('/admin/rounds', roundData);
            setShowAddRound(false);
            fetchEventDetails();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create round');
        }
    };

    const handleStartRound = async (roundId) => {
        try {
            await axios.post(`/admin/rounds/${roundId}/start`);
            fetchEventDetails();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to start round');
        }
    };

    const handleEndRound = async (roundId) => {
        if (!window.confirm('Are you sure you want to end this round? All participants will be marked as available.')) return;
        try {
            await axios.post(`/admin/rounds/${roundId}/end`);
            fetchEventDetails();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to end round');
        }
    };

    const handleEditRound = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const roundData = {
            name: formData.get('name'),
            venue: formData.get('venue'),
            instructions: formData.get('instructions'),
            isElimination: formData.get('isElimination') === 'true'
        };

        try {
            await axios.put(`/admin/rounds/${editingRound._id}`, roundData);
            setEditingRound(null);
            toast.success('Round updated successfully');
            fetchEventDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update round');
        }
    };

    const handleDeleteRound = async (roundId) => {
        if (!window.confirm('Are you sure you want to delete this round? This will ALSO delete all groups, panels, and evaluations associated with it! This action CANNOT be undone.')) return;
        try {
            setIsDeletingRound(true);
            await axios.delete(`/admin/rounds/${roundId}`);
            toast.success('Round deleted successfully');
            fetchEventDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete round');
        } finally {
            setIsDeletingRound(false);
        }
    };

    const openShortlistModal = async (round) => {
        try {
            // If round 1, get all approved participants for this subevent
            // If round > 1, get winners of round - 1
            let participants = [];
            if (round.roundNumber === 1) {
                const res = await axios.get(`/admin/subevents/${id}/participants`);
                participants = res.data.data;
            } else {
                const prevRound = rounds.find(r => r.roundNumber === round.roundNumber - 1);
                participants = prevRound?.winners || [];
            }

            setEligibleParticipants(participants);
            setSelectedParticipants(round.participants?.map(p => p._id) || []);
            setShowShortlistModal(round._id);
        } catch (error) {
            console.error('Failed to fetch eligible participants:', error);
        }
    };

    const handleSaveShortlist = async () => {
        try {
            await axios.post(`/admin/rounds/${showShortlistModal}/participants`, {
                participantIds: selectedParticipants
            });
            setShowShortlistModal(null);
            fetchEventDetails();
        } catch (error) {
            alert('Failed to save shortlist');
        }
    };

    const handleManualStatusUpdate = async (id, status) => {
        try {
            await axios.put(`/admin/participants/${id}/current-status`, { status });
            toast.success(`Availability updated to ${status}`);
            fetchEventParticipants();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDeleteParticipant = async (id) => {
        if (!window.confirm('Are you sure you want to delete this participant? This action cannot be undone.')) return;
        try {
            await axios.delete(`/admin/participants/${id}`);
            toast.success('Participant deleted successfully');
            fetchEventParticipants();
        } catch (error) {
            toast.error('Failed to delete participant');
        }
    };

    const handleMakeAllAvailable = async () => {
        if (!window.confirm('Are you sure you want to make all approved participants for this event available?')) return;
        try {
            await axios.put(`/admin/participants/subevent/${id}/make-all-available`);
            toast.success('All participants are now available');
            fetchEventParticipants();
        } catch (error) {
            toast.error('Failed to update participants');
        }
    };

    const handleManualNominate = async () => {
        if (!selectedRoundId || selectedRoundId === 'all') {
            toast.error('Please select a specific round first');
            return;
        }
        if (selectedParticipants.length === 0) {
            toast.error('Please select participants to nominate');
            return;
        }

        try {
            await axios.post(`/admin/rounds/${selectedRoundId}/manual-nominate`, {
                participantIds: selectedParticipants
            });
            toast.success('Selected participants nominated to next round!');
            setSelectedParticipants([]);
            fetchEventParticipants();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to nominate participants');
        }
    };

    const handleExportWinners = async (roundId, format) => {
        try {
            const response = await axios.get(`/admin/rounds/${roundId}/export-winners`, {
                params: { format },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const extension = format;
            link.setAttribute('download', `nominated_participants_${Date.now()}.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to export winners');
        }
    };

    if (loading || !subEvent) {
        return <Loader message="Establishing event control link..." />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/subevents')}
                    className="p-2 rounded-full hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] transition-smooth"
                >
                    <MdArrowBack className="w-6 h-6" />
                </button>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                            {subEvent.name}
                        </h1>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${subEvent.type === 'individual' ? 'bg-mindSaga-500/20 text-mindSaga-400' : 'bg-debate-500/20 text-debate-400'
                            }`}>
                            {subEvent.type}
                        </span>
                        {/* Event Status Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${subEvent.status === 'active' ? 'bg-status-available/20 text-status-available' :
                            subEvent.status === 'completed' ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]' :
                                'bg-debate-400/20 text-debate-400'
                            }`}>
                            {subEvent.status === 'not_started' ? 'Not Started' : subEvent.status}
                        </span>
                    </div>
                    <p className="text-[var(--color-text-secondary)]">Control Room & Round Management</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-[var(--glass-border)] pb-2 overflow-x-auto">
                {(subEvent.type === 'individual'
                    ? ['rounds', 'shortlist', 'participants', 'settings']
                    : ['rounds', 'groups', 'panels', 'evaluations', 'participants', 'settings']
                ).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-medium capitalize transition-smooth relative whitespace-nowrap ${activeTab === tab ? 'text-mindSaga-400' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                            }`}
                    >
                        {tab} {activeTab === tab && <motion.div layoutId="tab-active" className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-mindSaga-500" />}
                    </button>
                ))}
            </div>

            {/* Round Selector for Management Tabs */}
            {
                (['groups', 'panels', 'evaluations', 'shortlist'].includes(activeTab)) && rounds.length > 0 && (
                    <div className="flex items-center gap-4 bg-[var(--color-bg-tertiary)] p-3 rounded-xl border border-[var(--glass-border)]">
                        <span className="text-sm font-semibold text-[var(--color-text-muted)]">Managing Round:</span>
                        <div className="flex gap-2">
                            {rounds.map(round => (
                                <button
                                    key={round._id}
                                    onClick={() => setSelectedRoundId(round._id)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-smooth ${selectedRoundId === round._id
                                        ? 'bg-mindSaga-600 text-white shadow-lg'
                                        : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                                        }`}
                                >
                                    Round {round.roundNumber}: {round.name}
                                    {round.status === 'active' && <span className="ml-2 w-2 h-2 rounded-full bg-status-available inline-block animate-pulse" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Rounds Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'rounds' && (
                    <motion.div
                        key="rounds"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Event Rounds</h2>
                            <Button onClick={() => setShowAddRound(true)}>
                                <MdAdd className="w-5 h-5" /> Create Round
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {rounds.length === 0 ? (
                                <Card className="p-12 text-center border-dashed border-2 border-[var(--glass-border)]">
                                    <p className="text-[var(--color-text-muted)]">No rounds created yet. Start by creating the first round.</p>
                                </Card>
                            ) : rounds.map((round) => (
                                <Card key={round._id} className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="w-8 h-8 rounded-full bg-mindSaga-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {round.roundNumber}
                                                </span>
                                                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{round.name}</h3>
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${round.status === 'active' ? 'bg-status-available/20 text-status-available' :
                                                    round.status === 'completed' ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]' :
                                                        'bg-debate-400/20 text-debate-400'
                                                    }`}>
                                                    {round.status}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-secondary)]">
                                                <span className="flex items-center gap-1"><MdLocationOn className="text-mindSaga-400" /> {round.venue || 'TBD'}</span>
                                                <span className="flex items-center gap-1"><MdPeople className="text-mindSaga-400" /> {round.participants?.length || 0} Shortlisted</span>
                                                {round.isElimination && <span className="text-status-busy/80 font-medium">Elimination Round</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openShortlistModal(round)}>
                                                Manage Shortlist
                                            </Button>
                                            {round.status === 'pending' && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleStartRound(round._id)}
                                                    disabled={!round.participants?.length}
                                                >
                                                    <MdPlayArrow className="w-5 h-5" /> Start
                                                </Button>
                                            )}
                                            {round.status === 'active' && (
                                                <Button variant="danger" size="sm" onClick={() => handleEndRound(round._id)}>
                                                    <MdStop className="w-5 h-5" /> End
                                                </Button>
                                            )}
                                            {round.winners?.length > 0 && (
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleExportWinners(round._id, 'csv')}
                                                        title="Export Winners CSV"
                                                    >
                                                        <MdFileDownload /> CSV
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleExportWinners(round._id, 'html')}
                                                        title="Export Winners HTML"
                                                    >
                                                        <MdFileDownload /> HTML
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleExportWinners(round._id, 'pdf')}
                                                        title="Export Winners PDF"
                                                    >
                                                        <MdFileDownload /> PDF
                                                    </Button>
                                                </div>
                                            )}
                                            <Button variant="outline" size="sm" onClick={() => setEditingRound(round)}>
                                                <MdSettings />
                                            </Button>
                                            <Button variant="danger" size="sm" onClick={() => handleDeleteRound(round._id)} disabled={isDeletingRound}>
                                                <MdDelete />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Groups Tab */}
                {activeTab === 'groups' && (
                    <motion.div
                        key="groups"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <GroupManagement roundId={selectedRoundId} subEventId={id} />
                    </motion.div>
                )}

                {/* Panels Tab */}
                {activeTab === 'panels' && (
                    <motion.div
                        key="panels"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <PanelManagement roundId={selectedRoundId} subEventId={id} />
                    </motion.div>
                )}

                {/* Evaluations Tab */}
                {activeTab === 'evaluations' && (
                    <motion.div
                        key="evaluations"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <EvaluationOverview roundId={selectedRoundId} subEventId={id} />
                    </motion.div>
                )}

                {/* Shortlist Tab (For Individual Events) */}
                {activeTab === 'shortlist' && (
                    <motion.div
                        key="shortlist"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {!selectedRoundId || selectedRoundId === 'all' ? (
                            <Card className="p-12 text-center border-dashed border-2 border-[var(--glass-border)]">
                                <p className="text-[var(--color-text-muted)]">Please select a round above to manage shortlist.</p>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-[var(--glass-border)]">
                                    <div>
                                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Nominate to Next Round</h2>
                                        <p className="text-sm text-[var(--color-text-secondary)]">Manually select students to promote to the next stage.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => handleExportWinners(selectedRoundId, 'csv')}
                                            title="Export Nominated CSV"
                                        >
                                            <MdFileDownload /> CSV
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleExportWinners(selectedRoundId, 'html')}
                                            title="Export Nominated HTML"
                                        >
                                            <MdFileDownload /> HTML
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleExportWinners(selectedRoundId, 'pdf')}
                                            title="Export Nominated PDF"
                                        >
                                            <MdFileDownload /> PDF
                                        </Button>
                                        <Button
                                            variant="primary"
                                            disabled={selectedParticipants.length === 0}
                                            onClick={handleManualNominate}
                                        >
                                            Nominate {selectedParticipants.length} Participants
                                        </Button>
                                    </div>
                                </div>

                                <Card className="overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-[var(--color-bg-tertiary)] border-b border-[var(--glass-border)]">
                                                    <th className="px-6 py-4 w-10">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded bg-[var(--input-bg)] border-[var(--input-border)] text-mindSaga-500"
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedParticipants(eventParticipants.map(p => p._id));
                                                                } else {
                                                                    setSelectedParticipants([]);
                                                                }
                                                            }}
                                                            checked={selectedParticipants.length === eventParticipants.length && eventParticipants.length > 0}
                                                        />
                                                    </th>
                                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Participant</th>
                                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--glass-border)]">
                                                {eventParticipants.map(participant => (
                                                    <tr key={participant._id} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="checkbox"
                                                                className="rounded bg-[var(--input-bg)] border-[var(--input-border)] text-mindSaga-500"
                                                                checked={selectedParticipants.includes(participant._id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedParticipants([...selectedParticipants, participant._id]);
                                                                    } else {
                                                                        setSelectedParticipants(selectedParticipants.filter(id => id !== participant._id));
                                                                    }
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <p className="font-semibold text-[var(--color-text-primary)]">{participant.fullName}</p>
                                                                <p className="text-xs text-[var(--color-text-muted)]">{participant.prn}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded text-[10px] items-center gap-1 font-bold uppercase ${participant.currentStatus === 'qualified' ? 'bg-status-available/20 text-status-available' :
                                                                participant.currentStatus === 'rejected' ? 'bg-status-busy/20 text-status-busy' :
                                                                    'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
                                                                }`}>
                                                                {participant.currentStatus}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {eventParticipants.length === 0 && (
                                                    <tr>
                                                        <td colSpan="3" className="px-6 py-10 text-center text-[var(--color-text-muted)] italic">
                                                            No participants in this round yet. Go to Rounds to manage shortlist.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Participants Tab */}
                {activeTab === 'participants' && (
                    <motion.div
                        key="participants"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        <div className="flex justify-between items-center bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-[var(--glass-border)]">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Event Participants</h2>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Manage participants for the event</p>
                                </div>
                                <div className="h-8 w-[1px] bg-[var(--glass-border)] mx-2"></div>
                                <select
                                    value={selectedRoundId || 'all'}
                                    onChange={(e) => {
                                        setSelectedRoundId(e.target.value === 'all' ? null : e.target.value);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-sm focus:outline-none focus:ring-2 focus:ring-mindSaga-500"
                                >
                                    <option value="all">All Participants</option>
                                    {rounds.map(r => (
                                        <option key={r._id} value={r._id}>{r.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] text-sm focus:outline-none focus:ring-2 focus:ring-mindSaga-500"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="qualified">Qualified</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="in_group">In Group</option>
                                    <option value="available">Available</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search participants..."
                                        className="pl-10 pr-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--glass-border)] text-[var(--color-text-primary)] rounded-lg focus:outline-none focus:ring-1 focus:ring-mindSaga-500 w-64"
                                        value={searchParticipant}
                                        onChange={(e) => setSearchParticipant(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" size="sm" onClick={fetchEventParticipants}>
                                    <MdRefresh className="w-4 h-4" />
                                </Button>
                                <Button variant="danger" size="sm" onClick={handleMakeAllAvailable}>
                                    Make All Available
                                </Button>
                            </div>
                        </div>

                        {participantsLoading ? (
                            <div className="flex items-center justify-center p-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-mindSaga-500"></div>
                            </div>
                        ) : (
                            <Card className="overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-[var(--color-bg-tertiary)] border-b border-[var(--glass-border)]">
                                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Participant</th>
                                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">PRN / ID</th>
                                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Status</th>
                                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--glass-border)]">
                                            {eventParticipants
                                                .filter(p => {
                                                    const matchesSearch = p.fullName.toLowerCase().includes(searchParticipant.toLowerCase()) ||
                                                        (p.prn?.toLowerCase() || '').includes(searchParticipant.toLowerCase());

                                                    if (!matchesSearch) return false;
                                                    if (statusFilter === 'all') return true;

                                                    // Status specific logic
                                                    const assignedGroup = roundGroups.find(g => g.participants.some(pt => pt._id === p._id));
                                                    const participantEvals = roundEvaluations.filter(ev =>
                                                        ev.participantRatings?.some(pr => pr.participantId === p._id)
                                                    );
                                                    const isSelectedByJudge = participantEvals.some(ev =>
                                                        ev.participantRatings.find(pr => pr.participantId === p._id)?.selectedForNextRound
                                                    );

                                                    if (statusFilter === 'qualified') return isSelectedByJudge;
                                                    if (statusFilter === 'rejected') return assignedGroup?.evaluationStatus === 'completed' && !isSelectedByJudge;
                                                    if (statusFilter === 'in_group') return assignedGroup && assignedGroup.evaluationStatus !== 'completed';
                                                    if (statusFilter === 'available') return p.currentStatus === 'available';

                                                    return true;
                                                })
                                                .map(participant => (
                                                    <tr key={participant._id} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <p className="font-semibold text-[var(--color-text-primary)]">{participant.fullName}</p>
                                                                <p className="text-xs text-[var(--color-text-muted)]">{participant.email}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="font-mono text-sm text-[var(--color-text-secondary)]">{participant.prn}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {selectedRoundId && selectedRoundId !== 'all' ? (
                                                                (() => {
                                                                    const assignedGroup = roundGroups.find(g => g.participants.some(p => p._id === participant._id));

                                                                    // Find evaluations for this participant
                                                                    const participantEvals = roundEvaluations.filter(ev =>
                                                                        ev.participantRatings?.some(pr => pr.participantId === participant._id)
                                                                    );

                                                                    const isSelectedByJudge = participantEvals.some(ev =>
                                                                        ev.participantRatings.find(pr => pr.participantId === participant._id)?.selectedForNextRound
                                                                    );

                                                                    if (assignedGroup) {
                                                                        if (assignedGroup.evaluationStatus === 'completed') {
                                                                            if (isSelectedByJudge) {
                                                                                return (
                                                                                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-status-available/20 text-status-available">
                                                                                        Qualified for Next Round
                                                                                    </span>
                                                                                );
                                                                            } else {
                                                                                return (
                                                                                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-status-busy/20 text-status-busy">
                                                                                        Rejected
                                                                                    </span>
                                                                                );
                                                                            }
                                                                        }

                                                                        // If not completed but has a selection
                                                                        if (isSelectedByJudge) {
                                                                            return (
                                                                                <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-status-available/20 text-status-available">
                                                                                    Selected (Judge)
                                                                                </span>
                                                                            );
                                                                        }

                                                                        return (
                                                                            <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400">
                                                                                In {assignedGroup.groupName}
                                                                            </span>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-status-available/20 text-status-available">
                                                                            Qualified
                                                                        </span>
                                                                    );
                                                                })()
                                                            ) : (
                                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${participant.currentStatus === 'available' ? 'bg-status-available/20 text-status-available' : 'bg-status-busy/20 text-status-busy'
                                                                    }`}>
                                                                    {participant.currentStatus}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <select
                                                                    value={(() => {
                                                                        const assignedGroup = roundGroups.find(g => g.participants.some(p => p._id === participant._id));
                                                                        const participantEvals = roundEvaluations.filter(ev =>
                                                                            ev.participantRatings?.some(pr => pr.participantId === participant._id)
                                                                        );
                                                                        const isSelectedByJudge = participantEvals.some(ev =>
                                                                            ev.participantRatings.find(pr => pr.participantId === participant._id)?.selectedForNextRound
                                                                        );

                                                                        // If admin has manually set a specific final status, use it
                                                                        if (['qualified', 'rejected'].includes(participant.currentStatus)) {
                                                                            return participant.currentStatus;
                                                                        }

                                                                        // Auto-adjust based on judging if group evaluation is completed
                                                                        if (assignedGroup?.evaluationStatus === 'completed') {
                                                                            return isSelectedByJudge ? 'qualified' : 'rejected';
                                                                        }

                                                                        return participant.currentStatus;
                                                                    })()}
                                                                    onChange={(e) => handleManualStatusUpdate(participant._id, e.target.value)}
                                                                    className={`px-2 py-1 rounded border text-xs focus:outline-none transition-smooth ${['qualified', 'rejected'].includes(participant.currentStatus) ? 'bg-mindSaga-600/20 border-mindSaga-500/50' : 'bg-[var(--color-bg-tertiary)] border-[var(--glass-border)]'}`}
                                                                >
                                                                    <option value="available">Available</option>
                                                                    <option value="busy">Busy</option>
                                                                    <option value="registered">Registered</option>
                                                                    <option value="qualified">Qualified ✅</option>
                                                                    <option value="rejected">Rejected ❌</option>
                                                                </select>
                                                                <Button variant="outline" size="sm" onClick={() => navigate(`/admin/participants/${participant._id}`)} title="Profile">
                                                                    <MdPerson />
                                                                </Button>
                                                                <button
                                                                    onClick={() => handleDeleteParticipant(participant._id)}
                                                                    className="p-1.5 rounded hover:bg-status-busy/20 text-status-busy transition-smooth"
                                                                    title="Delete"
                                                                >
                                                                    <MdDelete className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            {eventParticipants.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-10 text-center text-[var(--color-text-muted)] italic">
                                                        No participants found for this sub-event.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}
                    </motion.div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <motion.div
                        key="settings"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <Card className="p-8">
                            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Sub-Event Settings</h2>
                            <form onSubmit={handleUpdateEvent} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Event Name" name="name" defaultValue={subEvent.name} required />
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-[var(--color-text-muted)]">Event Type</label>
                                        <select
                                            name="type"
                                            defaultValue={subEvent.type}
                                            className="w-full px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-mindSaga-500"
                                        >
                                            <option value="individual">Individual</option>
                                            <option value="group">Group</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Description</label>
                                        <textarea
                                            name="description"
                                            defaultValue={subEvent.description}
                                            rows={4}
                                            className="w-full px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-mindSaga-500 resize-none"
                                        />
                                    </div>
                                    <Input label="Max Participants" name="maxParticipants" type="number" defaultValue={subEvent.maxParticipants} />
                                    <Input label="Registration Price (₹)" name="registrationPrice" type="number" defaultValue={subEvent.registrationPrice} />
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-[var(--color-text-muted)]">Accent Color</label>
                                        <select
                                            name="accentColor"
                                            defaultValue={subEvent.accentColor}
                                            className="w-full px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-mindSaga-500"
                                        >
                                            <option value="mindSaga">MindSaga (Purple/Blue)</option>
                                            <option value="debate">VerbaFest (Blue/Cyan)</option>
                                            <option value="cultural">Finesse (Gold/Amber)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-[var(--glass-border)] flex flex-col md:flex-row gap-4 items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <p className="text-sm text-[var(--color-text-muted)]">Registration status:</p>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={subEvent.isActiveForRegistration} onChange={handleToggleRegistration} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mindSaga-600"></div>
                                            <span className="ml-3 text-sm font-medium text-[var(--color-text-primary)]">
                                                {subEvent.isActiveForRegistration ? 'Open for Registration' : 'Registration Closed'}
                                            </span>
                                        </label>
                                    </div>
                                    <div className="flex gap-4 w-full md:w-auto">
                                        <Button type="submit" variant="primary" className="flex-1 md:flex-initial" disabled={isUpdatingEvent}>
                                            {isUpdatingEvent ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Round Modal */}
            {
                showAddRound && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <Card className="w-full max-w-lg p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Create New Round</h2>
                                <button
                                    onClick={() => setShowAddRound(false)}
                                    className="p-2 rounded-full hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]"
                                >
                                    <MdClose className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateRound} className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-[var(--color-text-muted)]">Round Name</label>
                                    <select name="name" className="w-full px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-mindSaga-500">
                                        <option value="Round 1">Round 1</option>
                                        <option value="Round 2">Round 2</option>
                                        <option value="Round 3">Round 3</option>
                                        <option value="Semi Final">Semi Final</option>
                                        <option value="Final Round">Final Round</option>
                                    </select>
                                </div>
                                <Input label="Venue" name="venue" placeholder="e.g., Hall 1, Main Stage" />
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-[var(--color-text-muted)]">Type</label>
                                    <select name="isElimination" className="w-full px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-mindSaga-500">
                                        <option value="true">Elimination Round</option>
                                        <option value="false">Non-Elimination Round</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-6">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddRound(false)}>Cancel</Button>
                                    <Button type="submit" variant="primary" className="flex-1">Create Round</Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )
            }

            {/* Edit Round Modal */}
            {
                editingRound && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <Card className="w-full max-w-lg p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Edit Round</h2>
                                <button
                                    onClick={() => setEditingRound(null)}
                                    className="p-2 rounded-full hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]"
                                >
                                    <MdClose className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleEditRound} className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-[var(--color-text-muted)]">Round Name</label>
                                    <select name="name" defaultValue={editingRound.name} className="w-full px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-mindSaga-500">
                                        <option value="Round 1">Round 1</option>
                                        <option value="Round 2">Round 2</option>
                                        <option value="Round 3">Round 3</option>
                                        <option value="Semi Final">Semi Final</option>
                                        <option value="Final Round">Final Round</option>
                                    </select>
                                </div>
                                <Input label="Venue" name="venue" defaultValue={editingRound.venue} placeholder="e.g., Hall 1, Main Stage" />
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-[var(--color-text-muted)]">Instructions</label>
                                    <textarea
                                        name="instructions"
                                        defaultValue={editingRound.instructions}
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-mindSaga-500 resize-none font-sans"
                                        placeholder="Specific instructions for this round..."
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-[var(--color-text-muted)]">Type</label>
                                    <select name="isElimination" defaultValue={editingRound.isElimination.toString()} className="w-full px-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-mindSaga-500">
                                        <option value="true">Elimination Round</option>
                                        <option value="false">Non-Elimination Round</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-6">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingRound(null)}>Cancel</Button>
                                    <Button type="submit" variant="primary" className="flex-1">Update Round</Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )
            }

            {/* Shortlist Modal */}
            {
                showShortlistModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <Card className="w-full max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden">
                            <div className="p-6 border-b border-[var(--glass-border)] flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Manage Shortlist</h2>
                                    <p className="text-sm text-[var(--color-text-muted)]">Select participants for this round</p>
                                </div>
                                <button
                                    onClick={() => setShowShortlistModal(null)}
                                    className="p-2 rounded-full hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]"
                                >
                                    <MdClose className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-4 bg-[var(--color-bg-tertiary)]">
                                <div className="relative">
                                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or PRN..."
                                        className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] rounded-lg focus:outline-none"
                                        value={searchParticipant}
                                        onChange={(e) => setSearchParticipant(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {eligibleParticipants
                                    .filter(p => p.fullName.toLowerCase().includes(searchParticipant.toLowerCase()) ||
                                        (p.prn?.toLowerCase() || '').includes(searchParticipant.toLowerCase()))
                                    .map(p => (
                                        <div
                                            key={p._id}
                                            onClick={() => {
                                                if (selectedParticipants.includes(p._id)) {
                                                    setSelectedParticipants(prev => prev.filter(id => id !== p._id));
                                                } else {
                                                    setSelectedParticipants(prev => [...prev, p._id]);
                                                }
                                            }}
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-smooth cursor-pointer ${selectedParticipants.includes(p._id)
                                                ? 'bg-mindSaga-600/10 border-mindSaga-500'
                                                : 'bg-[var(--color-bg-secondary)] border-[var(--glass-border)] hover:border-mindSaga-500/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedParticipants.includes(p._id) ? 'bg-mindSaga-600 border-mindSaga-500' : 'border-[var(--color-text-muted)]'
                                                    }`}>
                                                    {selectedParticipants.includes(p._id) && <MdCheckCircle className="text-white w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[var(--color-text-primary)]">{p.fullName}</p>
                                                    <p className="text-xs text-[var(--color-text-muted)] font-mono">{p.prn} • {p.email}</p>
                                                </div>
                                            </div>
                                            {p.currentStatus === 'busy' && (
                                                <span className="px-2 py-0.5 rounded text-[10px] bg-status-busy/20 text-status-busy font-bold uppercase">
                                                    Busy
                                                </span>
                                            )}
                                        </div>
                                    ))}
                            </div>

                            <div className="p-6 border-t border-[var(--glass-border)] flex gap-4">
                                <Button variant="outline" className="flex-1" onClick={() => setShowShortlistModal(null)}>Cancel</Button>
                                <Button variant="primary" className="flex-1" onClick={handleSaveShortlist}>
                                    Save Shortlist ({selectedParticipants.length})
                                </Button>
                            </div>
                        </Card>
                    </div>
                )
            }
        </div >
    );
};

export default EventControlRoom;
