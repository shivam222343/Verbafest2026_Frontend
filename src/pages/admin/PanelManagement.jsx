import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdAdd, MdEdit, MdDelete, MdContentCopy, MdRefresh,
    MdCheckCircle, MdPending, MdGroup, MdPerson, MdEmail,
    MdPhone, MdVpnKey, MdClose, MdSend
} from 'react-icons/md';
import axios from '../../lib/axios';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAdminSocket } from '../../hooks/useSocket';
import Loader from '../../components/ui/Loader';

const PanelManagement = ({ roundId, subEventId }) => {
    const [panels, setPanels] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedPanel, setSelectedPanel] = useState(null);
    const [selectedGroupIds, setSelectedGroupIds] = useState([]);
    const [editingPanel, setEditingPanel] = useState(null);
    const [selectedRoundId, setSelectedRoundId] = useState(roundId);
    const [rounds, setRounds] = useState([]);

    const [formData, setFormData] = useState({
        panelName: '',
        venue: '',
        instructions: '',
        judges: [{ name: '', email: '', phone: '' }],
        evaluationParameters: [
            { name: 'Content', maxScore: 10, weight: 1 },
            { name: 'Presentation', maxScore: 10, weight: 1 },
            { name: 'Teamwork', maxScore: 10, weight: 1 }
        ]
    });

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
    const handlePanelCreated = useCallback((data) => {
        console.log('Panel created:', data);
        toast.success(`New panel "${data.panelName}" created!`, {
            icon: '🎯'
        });
        if (selectedRoundId) fetchPanels(selectedRoundId);
    }, [selectedRoundId]);

    const handleJudgeLoggedIn = useCallback((data) => {
        console.log('Judge logged in:', data);
        toast.success(`${data.judgeName} has logged in to ${data.panelName}`, {
            icon: '👨‍⚖️',
            duration: 3000
        });

        // Update panel to show judge has accessed
        setPanels(prevPanels => prevPanels.map(panel => {
            if (panel._id === data.panelId) {
                return {
                    ...panel,
                    judges: panel.judges.map(judge =>
                        judge.email === data.judgeEmail
                            ? { ...judge, hasAccessed: true, lastAccessedAt: data.accessedAt }
                            : judge
                    )
                };
            }
            return panel;
        }));
    }, []);

    const handleEvaluationSubmitted = useCallback((data) => {
        console.log('Evaluation submitted:', data);
        toast.success(`${data.judgeName} evaluated ${data.groupName}`, {
            icon: '📝',
            duration: 2000
        });
    }, []);

    const socket = useAdminSocket({
        onPanelCreated: handlePanelCreated,
        onJudgeLoggedIn: handleJudgeLoggedIn,
        onEvaluationSubmitted: handleEvaluationSubmitted
    });

    useEffect(() => {
        if (selectedRoundId) {
            fetchPanels(selectedRoundId);
            fetchGroups(selectedRoundId);
        }
    }, [selectedRoundId]);

    const fetchPanels = useCallback(async (rId) => {
        if (!subEventId) return;
        try {
            setLoading(true);
            console.log(`Fetching panels for subEvent ${subEventId}...`);
            const response = await axios.get(`/admin/panels/subevent/${subEventId}`);
            setPanels(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch panels');
            console.error('Fetch panels error:', error);
        } finally {
            setLoading(false);
        }
    }, [subEventId]);

    const fetchGroups = useCallback(async (rId) => {
        const idToUse = rId || selectedRoundId;
        if (!idToUse) return;
        try {
            const response = await axios.get(`/admin/groups/round/${idToUse}`);
            setAllGroups(response.data.data);
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        }
    }, [selectedRoundId]);

    const handleAddJudge = () => {
        setFormData({
            ...formData,
            judges: [...formData.judges, { name: '', email: '', phone: '' }]
        });
    };

    const handleRemoveJudge = (index) => {
        const newJudges = formData.judges.filter((_, i) => i !== index);
        setFormData({ ...formData, judges: newJudges });
    };

    const handleJudgeChange = (index, field, value) => {
        const newJudges = [...formData.judges];
        newJudges[index][field] = value;
        setFormData({ ...formData, judges: newJudges });
    };

    const handleAddParameter = () => {
        setFormData({
            ...formData,
            evaluationParameters: [
                ...formData.evaluationParameters,
                { name: '', maxScore: 10, weight: 1 }
            ]
        });
    };

    const handleRemoveParameter = (index) => {
        const newParams = formData.evaluationParameters.filter((_, i) => i !== index);
        setFormData({ ...formData, evaluationParameters: newParams });
    };

    const handleParameterChange = (index, field, value) => {
        const newParams = [...formData.evaluationParameters];
        newParams[index][field] = field === 'name' ? value : parseFloat(value) || 0;
        setFormData({ ...formData, evaluationParameters: newParams });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate judges
        const validJudges = formData.judges.filter(j => j.name && j.email);
        if (validJudges.length === 0) {
            toast.error('Please add at least one judge with name and email');
            return;
        }

        try {
            const payload = {
                subEventId,
                panelName: formData.panelName,
                venue: formData.venue,
                instructions: formData.instructions,
                judges: validJudges,
                evaluationParameters: formData.evaluationParameters
            };

            if (editingPanel) {
                await axios.put(`/admin/panels/${editingPanel._id}`, payload);
                toast.success('Panel updated successfully!');
            } else {
                await axios.post('/admin/panels', payload);
                toast.success('Panel created successfully!');
            }

            setShowCreateModal(false);
            setEditingPanel(null);
            resetForm();
            if (selectedRoundId) fetchPanels(selectedRoundId);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save panel');
        }
    };

    const handleEdit = (panel) => {
        setEditingPanel(panel);
        setFormData({
            panelName: panel.panelName,
            venue: panel.venue || '',
            instructions: panel.instructions || '',
            judges: panel.judges.map(j => ({
                name: j.name,
                email: j.email,
                phone: j.phone || ''
            })),
            evaluationParameters: panel.evaluationParameters
        });
        setShowCreateModal(true);
    };

    const handleDelete = async (panelId) => {
        if (!window.confirm('Are you sure you want to delete this panel?')) return;

        try {
            await axios.delete(`/admin/panels/${panelId}`);
            toast.success('Panel deleted successfully');
            fetchPanels();
        } catch (error) {
            toast.error('Failed to delete panel');
        }
    };

    const handleRegenerateCodes = async (panelId) => {
        if (!window.confirm('This will regenerate all access codes. Continue?')) return;

        try {
            await axios.post(`/admin/panels/${panelId}/regenerate-codes`);
            toast.success('Access codes regenerated!');
            fetchPanels();
        } catch (error) {
            toast.error('Failed to regenerate codes');
        }
    };

    const handleAssignGroups = async () => {
        if (!selectedPanel) return;

        try {
            setLoading(true);
            const response = await axios.post(`/admin/panels/${selectedPanel._id}/assign-groups`, {
                groupIds: selectedGroupIds
            });

            if (response.data.success) {
                toast.success('Groups assigned successfully');
                setShowAssignModal(false);
                fetchPanels(selectedRoundId);
                fetchGroups(selectedRoundId);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign groups');
        } finally {
            setLoading(false);
        }
    };

    const copyAccessCode = (code, judgeName) => {
        navigator.clipboard.writeText(code);
        toast.success(`Copied ${judgeName}'s access code!`);
    };

    const handleAssignSubmit = async () => {
        try {
            await axios.post(`/admin/panels/${selectedPanel._id}/assign-groups`, {
                groupIds: selectedGroupIds
            });
            toast.success('Groups assigned successfully!');
            setShowAssignModal(false);
            if (selectedRoundId) fetchPanels(selectedRoundId);
        } catch (error) {
            toast.error('Failed to assign groups');
        }
    };

    const resetForm = () => {
        setFormData({
            panelName: '',
            venue: '',
            instructions: '',
            judges: [{ name: '', email: '', phone: '' }],
            evaluationParameters: [
                { name: 'Content', maxScore: 10, weight: 1 },
                { name: 'Presentation', maxScore: 10, weight: 1 },
                { name: 'Teamwork', maxScore: 10, weight: 1 }
            ]
        });
    };

    if (!selectedRoundId && !roundId) {
        return (
            <Card className="p-12 text-center border-dashed border-2 border-[var(--glass-border)]">
                <MdGroup className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                    No Round Selected
                </h3>
                <p className="text-[var(--color-text-muted)]">
                    Please create or select a round from the control room to manage panels.
                </p>
            </Card>
        );
    }

    if (loading) {
        return <Loader message="Loading panels..." />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                        Panel Management
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Manage judges, evaluation criteria, and group assignments
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
                        onClick={() => selectedRoundId && fetchPanels(selectedRoundId)}
                    >
                        <MdRefresh className="w-5 h-5" />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => {
                            setEditingPanel(null);
                            setFormData({
                                panelName: '',
                                venue: '',
                                instructions: '',
                                judges: [{ name: '', email: '', phone: '' }],
                                evaluationParameters: [
                                    { name: 'Content', maxScore: 10, weight: 1 },
                                    { name: 'Presentation', maxScore: 10, weight: 1 },
                                    { name: 'Teamwork', maxScore: 10, weight: 1 }
                                ]
                            });
                            setShowCreateModal(true);
                        }}
                    >
                        <MdAdd className="w-5 h-5" />
                        Create Panel
                    </Button>
                </div>
            </div>

            {/* Panels Grid */}
            {panels.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2">
                    <MdGroup className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4 opacity-20" />
                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                        No Panels Created
                    </h3>
                    <p className="text-[var(--color-text-muted)] mb-6">
                        No evaluation panels have been set up for this round yet.
                    </p>
                    <Button
                        onClick={() => {
                            setEditingPanel(null);
                            resetForm();
                            setShowCreateModal(true);
                        }}
                    >
                        <MdAdd className="w-5 h-5" />
                        Create First Panel
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {panels.map((panel, index) => (
                        <motion.div
                            key={panel._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="p-6">
                                {/* Panel Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                                                {panel.panelName}
                                            </h3>
                                            {(() => {
                                                const roundGroups = panel.assignedGroups?.filter(g => g.roundId === selectedRoundId) || [];
                                                const activeGroup = roundGroups.find(g => g.evaluationStatus !== 'completed');
                                                return activeGroup ? (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-status-busy/20 text-status-busy flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-status-busy animate-pulse"></span>
                                                        Busy (Evaluating {activeGroup.groupName})
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-status-available/20 text-status-available flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-status-available"></span>
                                                        Available
                                                    </span>
                                                );
                                            })()}

                                        </div>
                                        <p className="text-sm text-[var(--color-text-muted)]">
                                            Panel #{panel.panelNumber}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(panel)}
                                            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-smooth"
                                        >
                                            <MdEdit className="w-4 h-4 text-[var(--color-text-muted)]" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(panel._id)}
                                            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-smooth"
                                        >
                                            <MdDelete className="w-4 h-4 text-status-busy" />
                                        </button>
                                    </div>
                                </div>

                                {/* Venue */}
                                {panel.venue && (
                                    <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                                        📍 {panel.venue}
                                    </p>
                                )}

                                {/* Judges */}
                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                                            Judges ({panel.judges.length})
                                        </h4>
                                        <button
                                            onClick={() => handleRegenerateCodes(panel._id)}
                                            className="text-xs text-mindSaga-400 hover:text-mindSaga-300 flex items-center gap-1"
                                        >
                                            <MdRefresh className="w-3 h-3" />
                                            Regenerate Codes
                                        </button>
                                    </div>
                                    {panel.judges.map((judge, jIndex) => (
                                        <div
                                            key={jIndex}
                                            className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] space-y-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-mindSaga-600 flex items-center justify-center text-white text-sm font-bold">
                                                        {judge.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-[var(--color-text-primary)] text-sm">
                                                            {judge.name}
                                                        </p>
                                                        <p className="text-xs text-[var(--color-text-muted)]">
                                                            {judge.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                {judge.hasAccessed && (
                                                    <MdCheckCircle className="w-5 h-5 text-status-available" title="Judge has logged in" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--glass-border)]">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[10px] text-[var(--color-text-muted)] uppercase">Access Code</p>
                                                            <p className="font-mono font-bold text-mindSaga-400 text-sm">
                                                                {judge.accessCode}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => copyAccessCode(judge.accessCode, judge.name)}
                                                            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-smooth"
                                                        >
                                                            <MdContentCopy className="w-4 h-4 text-[var(--color-text-muted)]" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Assigned Groups */}
                                <div className="pt-4 border-t border-[var(--glass-border)] space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                                            Assigned Groups ({panel.assignedGroups?.filter(g => (g.roundId?._id || g.roundId) === selectedRoundId).length || 0})
                                        </p>
                                        <button
                                            onClick={() => {
                                                setSelectedPanel(panel);
                                                const roundGroups = panel.assignedGroups?.filter(g => (g.roundId?._id || g.roundId) === selectedRoundId) || [];
                                                setSelectedGroupIds(roundGroups.map(g => g._id));
                                                setShowAssignModal(true);
                                            }}
                                            className="text-xs font-bold text-mindSaga-400 hover:text-mindSaga-300 uppercase"
                                        >
                                            Manage
                                        </button>
                                    </div>

                                    {(() => {
                                        const roundGroups = panel.assignedGroups?.filter(g => (g.roundId?._id || g.roundId) === selectedRoundId) || [];
                                        return roundGroups.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {roundGroups.map((group, gIdx) => (
                                                    <span
                                                        key={gIdx}
                                                        className="px-2 py-1 rounded-md bg-mindSaga-500/10 border border-mindSaga-500/20 text-mindSaga-400 text-[10px] font-bold"
                                                    >
                                                        {group.groupName || `Group ${gIdx + 1}`}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-[var(--color-text-muted)] italic">
                                                No groups assigned for this round yet
                                            </p>
                                        );
                                    })()}

                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                        >
                            <Card className="p-6 sm:p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                                        {editingPanel ? 'Edit Panel' : 'Create New Panel'}
                                    </h2>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-smooth"
                                    >
                                        <MdClose className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Panel Name"
                                            required
                                            value={formData.panelName}
                                            onChange={(e) => setFormData({ ...formData, panelName: e.target.value })}
                                            placeholder="e.g., Panel A"
                                        />
                                        <Input
                                            label="Venue"
                                            value={formData.venue}
                                            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                            placeholder="e.g., Hall 1"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2 block">
                                            Instructions for Judges
                                        </label>
                                        <textarea
                                            value={formData.instructions}
                                            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:ring-2 focus:ring-mindSaga-500 outline-none resize-none"
                                            placeholder="Special instructions for judges..."
                                        />
                                    </div>

                                    {/* Judges */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                                                Judges
                                            </h3>
                                            <Button type="button" variant="outline" size="sm" onClick={handleAddJudge}>
                                                <MdAdd className="w-4 h-4" />
                                                Add Judge
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {formData.judges.map((judge, index) => (
                                                <div key={index} className="p-4 rounded-lg bg-[var(--color-bg-tertiary)] space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-semibold text-[var(--color-text-primary)]">
                                                            Judge {index + 1}
                                                        </h4>
                                                        {formData.judges.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveJudge(index)}
                                                                className="text-status-busy hover:text-status-busy/80"
                                                            >
                                                                <MdDelete className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <Input
                                                            label="Name"
                                                            required
                                                            value={judge.name}
                                                            onChange={(e) => handleJudgeChange(index, 'name', e.target.value)}
                                                            placeholder="Dr. John Doe"
                                                        />
                                                        <Input
                                                            label="Email"
                                                            type="email"
                                                            required
                                                            value={judge.email}
                                                            onChange={(e) => handleJudgeChange(index, 'email', e.target.value)}
                                                            placeholder="judge@example.com"
                                                        />
                                                        <Input
                                                            label="Phone (Optional)"
                                                            value={judge.phone}
                                                            onChange={(e) => handleJudgeChange(index, 'phone', e.target.value)}
                                                            placeholder="+91 1234567890"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Evaluation Parameters */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                                                Evaluation Parameters
                                            </h3>
                                            <Button type="button" variant="outline" size="sm" onClick={handleAddParameter}>
                                                <MdAdd className="w-4 h-4" />
                                                Add Parameter
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            {formData.evaluationParameters.map((param, index) => (
                                                <div key={index} className="flex items-center gap-3">
                                                    <Input
                                                        placeholder="Parameter name"
                                                        value={param.name}
                                                        onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                                                        className="flex-1"
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="Max"
                                                        value={param.maxScore}
                                                        onChange={(e) => handleParameterChange(index, 'maxScore', e.target.value)}
                                                        className="w-20"
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="Weight"
                                                        value={param.weight}
                                                        onChange={(e) => handleParameterChange(index, 'weight', e.target.value)}
                                                        className="w-20"
                                                    />
                                                    {formData.evaluationParameters.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveParameter(index)}
                                                            className="p-2 text-status-busy hover:text-status-busy/80"
                                                        >
                                                            <MdDelete className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-4 pt-6 border-t border-[var(--glass-border)]">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="flex-1"
                                            onClick={() => setShowCreateModal(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" variant="primary" className="flex-1">
                                            {editingPanel ? 'Update Panel' : 'Create Panel'}
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Assign Groups Modal */}
            <AnimatePresence>
                {showAssignModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                        >
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                                            Assign Groups
                                        </h2>
                                        <p className="text-sm text-[var(--color-text-secondary)]">
                                            Select groups for {selectedPanel?.panelName}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowAssignModal(false)}
                                        className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-smooth"
                                    >
                                        <MdClose className="w-6 h-6" />
                                    </button>
                                </div>

                                {allGroups.length === 0 ? (
                                    <div className="p-10 text-center text-[var(--color-text-muted)] italic">
                                        No groups formed for this round yet.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                                        {allGroups.map((group) => {
                                            const isSelected = selectedGroupIds.includes(group._id);
                                            const isAssignedElsewhere = group.panelId && group.panelId !== selectedPanel?._id;

                                            return (
                                                <button
                                                    key={group._id}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setSelectedGroupIds(selectedGroupIds.filter(id => id !== group._id));
                                                        } else {
                                                            setSelectedGroupIds([...selectedGroupIds, group._id]);
                                                        }
                                                    }}
                                                    className={`p-4 rounded-xl border text-left transition-smooth flex items-center justify-between ${isSelected
                                                        ? 'bg-mindSaga-600/20 border-mindSaga-500 text-mindSaga-400'
                                                        : 'bg-[var(--color-bg-tertiary)] border-[var(--glass-border)] text-[var(--color-text-primary)] hover:border-mindSaga-500/50'
                                                        }`}
                                                >
                                                    <div>
                                                        <p className="font-bold">{group.groupName}</p>
                                                        <p className="text-xs text-[var(--color-text-muted)]">
                                                            {group.participants?.length || 0} participants
                                                        </p>
                                                    </div>
                                                    {isSelected && <MdCheckCircle className="w-5 h-5" />}
                                                    {!isSelected && isAssignedElsewhere && (
                                                        <span className="text-[10px] bg-debate-500/20 text-debate-400 px-1.5 py-0.5 rounded font-bold uppercase">
                                                            Already Assigned
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <Button
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => setShowAssignModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={handleAssignGroups}
                                        disabled={loading}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PanelManagement;
