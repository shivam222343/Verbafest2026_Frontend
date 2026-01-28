import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdLogout, MdCheckCircle, MdPending, MdStar, MdStarBorder,
    MdGroup, MdPerson, MdComment, MdSave, MdSend, MdRefresh
} from 'react-icons/md';
import axios from '../../lib/axios';
import toast from 'react-hot-toast';
import { useJudgeSocket } from '../../hooks/useSocket';
import Loader from '../../components/ui/Loader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import useThemeStore from '../../store/themeStore';
import ThemeToggle from '../../components/ThemeToggle';
import TopicSpinner from '../../components/TopicSpinner';
import { MdAutoFixHigh } from 'react-icons/md';

const JudgeDashboard = () => {
    const [judgeSession, setJudgeSession] = useState(null);
    const [panelData, setPanelData] = useState(null);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [evaluation, setEvaluation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTopicSpinner, setShowTopicSpinner] = useState(false);
    const { theme } = useThemeStore();
    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Socket.IO for real-time updates
    const handleEvaluationUpdated = useCallback((data) => {
        console.log('Evaluation updated:', data);
        // Update group status in real-time
        setGroups(prevGroups => prevGroups.map(g =>
            g._id === data.groupId
                ? { ...g, evaluationStatus: data.evaluationStatus }
                : g
        ));

        // Show toast notification
        if (data.evaluationStatus === 'completed') {
            toast.success(`All judges have evaluated this group!`, {
                icon: '✅'
            });
        }
    }, []);

    const handleGroupAssigned = useCallback((data) => {
        console.log('🆕 New group assigned via socket:', data);
        toast.success('Admin has assigned a new group to your panel!', {
            icon: '📋',
            duration: 5000
        });
        // Re-fetch panel data to get the new group details
        if (judgeSession?.accessCode) {
            fetchPanelData(judgeSession.accessCode);
        }
    }, [judgeSession]);

    const socket = useJudgeSocket(
        panelData?.panel?._id,
        {
            onEvaluationUpdated: handleEvaluationUpdated,
            onGroupAssigned: handleGroupAssigned
        }
    );

    useEffect(() => {
        const session = localStorage.getItem('judgeSession');
        if (!session) {
            navigate('/judge/login');
            return;
        }

        const parsedSession = JSON.parse(session);
        setJudgeSession(parsedSession);
        fetchPanelData(parsedSession.accessCode);
    }, []);

    const fetchPanelData = async (accessCode) => {
        try {
            setLoading(true);
            const response = await axios.get(`/judge/panel/${accessCode}`);
            const data = response.data.data;
            setPanelData(data);
            const allGroups = data.groups || [];
            // Filter out groups that are already completed
            const incompleteGroups = allGroups.filter(g => g.evaluationStatus !== 'completed');

            setPanelData(data);
            setGroups(incompleteGroups);

            if (incompleteGroups.length > 0) {
                // If we already have a selected group that is still valid (incomplete), keep it
                // Otherwise select the first incomplete group
                if (!selectedGroup || !incompleteGroups.find(g => g._id === selectedGroup._id)) {
                    const firstGroup = incompleteGroups[0];
                    setSelectedGroup(firstGroup);
                    await loadEvaluation(accessCode, firstGroup._id, data.panel, firstGroup);
                }
            } else {
                setSelectedGroup(null);
            }
        } catch (error) {
            toast.error('Failed to load panel data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadEvaluation = async (accessCode, groupId, panel, fullGroup) => {
        try {
            const response = await axios.get(`/judge/evaluations/${accessCode}/${groupId}`);
            const currentGroup = fullGroup || groups.find(g => g._id === groupId) || selectedGroup;
            const currentPanel = panel || panelData?.panel;

            if (response.data.data) {
                const loadedEval = response.data.data;

                // Sync participantRatings if missing or empty (handles legacy evaluations)
                if ((!loadedEval.participantRatings || loadedEval.participantRatings.length === 0) && currentGroup?.participants?.length > 0) {
                    loadedEval.participantRatings = currentGroup.participants.map(p => ({
                        participantId: p._id,
                        fullName: p.fullName,
                        scores: currentPanel.evaluationParameters.map(param => ({
                            parameterName: param.name,
                            score: 0,
                            maxScore: param.maxScore
                        })),
                        totalScore: 0,
                        maxTotalScore: currentPanel.evaluationParameters.reduce((sum, p) => sum + p.maxScore, 0),
                        remarks: '',
                        selectedForNextRound: false
                    }));
                }
                // Enrich loaded evaluation with full names from current group
                if (loadedEval.participantRatings && currentGroup?.participants) {
                    loadedEval.participantRatings = loadedEval.participantRatings.map(rating => {
                        const participant = currentGroup.participants.find(p => p._id === rating.participantId);
                        return {
                            ...rating,
                            fullName: participant ? participant.fullName : 'Unknown Participant'
                        };
                    });
                }
                setEvaluation(loadedEval);
            } else {
                // Initialize new evaluation
                initializeEvaluation(groupId, panel, currentGroup);
            }
        } catch (error) {
            const currentGroup = fullGroup || groups.find(g => g._id === groupId) || selectedGroup;
            initializeEvaluation(groupId, panel, currentGroup);
        }
    };

    const initializeEvaluation = (groupId, panel, fullGroup) => {
        const currentPanel = panel || panelData?.panel;
        if (!currentPanel?.evaluationParameters) return;

        const group = fullGroup || groups.find(g => g._id === groupId) || selectedGroup;

        setEvaluation({
            groupId,
            scores: currentPanel.evaluationParameters.map(param => ({
                parameterName: param.name,
                score: 0,
                maxScore: param.maxScore,
                weight: param.weight || 1
            })),
            comments: '',
            recommendForNextRound: false,
            participantRatings: group?.participants?.map(p => ({
                participantId: p._id,
                fullName: p.fullName,
                scores: currentPanel.evaluationParameters.map(param => ({
                    parameterName: param.name,
                    score: 0,
                    maxScore: param.maxScore
                })),
                totalScore: 0,
                maxTotalScore: currentPanel.evaluationParameters.reduce((sum, p) => sum + p.maxScore, 0),
                remarks: '',
                selectedForNextRound: false
            })) || []
        });
    };

    const handleParticipantScoreChange = (participantId, paramIndex, value) => {
        const newRatings = evaluation.participantRatings.map(p => {
            if (p.participantId === participantId) {
                const newScores = [...p.scores];
                const maxScore = newScores[paramIndex].maxScore;
                newScores[paramIndex].score = Math.min(Math.max(0, parseFloat(value) || 0), maxScore);

                const totalScore = newScores.reduce((sum, s) => sum + s.score, 0);
                return { ...p, scores: newScores, totalScore };
            }
            return p;
        });
        setEvaluation({ ...evaluation, participantRatings: newRatings });
    };

    const handleParticipantSelection = (participantId, selected) => {
        const newRatings = evaluation.participantRatings.map(p =>
            p.participantId === participantId ? { ...p, selectedForNextRound: selected } : p
        );
        setEvaluation({ ...evaluation, participantRatings: newRatings });
    };

    const handleParticipantRemarks = (participantId, remarks) => {
        const newRatings = evaluation.participantRatings.map(p =>
            p.participantId === participantId ? { ...p, remarks } : p
        );
        setEvaluation({ ...evaluation, participantRatings: newRatings });
    };

    const calculateOverallTotal = () => {
        // Overall score is average of participant percentages
        if (!evaluation.participantRatings.length) return 0;
        const totalPercentage = evaluation.participantRatings.reduce((sum, p) => {
            return sum + (p.totalScore / (p.maxTotalScore || 1)) * 100;
        }, 0);
        return (totalPercentage / evaluation.participantRatings.length).toFixed(2);
    };

    const handleSubmit = async (isDraft = false) => {
        try {
            const payload = {
                accessCode: judgeSession.accessCode,
                groupId: selectedGroup._id,
                scores: evaluation.scores, // Keeping for backward compat, but logic shifts
                comments: evaluation.comments,
                recommendForNextRound: evaluation.recommendForNextRound,
                participantRatings: evaluation.participantRatings,
                totalScore: evaluation.participantRatings.reduce((sum, p) => sum + p.totalScore, 0),
                maxTotalScore: evaluation.participantRatings.reduce((sum, p) => sum + p.maxTotalScore, 0)
            };

            const response = await axios.post('/judge/evaluate', payload);

            if (response.data.success) {
                toast.success(isDraft ? 'Evaluation saved as draft' : 'Evaluation submitted successfully!');

                // Move to next group if available
                const currentIndex = groups.findIndex(g => g._id === selectedGroup._id);
                if (currentIndex < groups.length - 1) {
                    const nextGroup = groups[currentIndex + 1];
                    setSelectedGroup(nextGroup);
                    await loadEvaluation(judgeSession.accessCode, nextGroup._id, panelData.panel, nextGroup);
                } else {
                    // No more groups, clear selection to show waiting screen
                    setSelectedGroup(null);
                    setGroups(prev => prev.filter(g => g._id !== selectedGroup._id)); // Optional: Remove completed group from list locally
                    toast.success("Waiting for admin to assign next group...");
                }
            }
        } catch (error) {
            toast.error('Failed to submit evaluation');
            console.error(error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('judgeSession');
        navigate('/judge/login');
    };

    if (loading) {
        return <Loader fullScreen message="Loading judge dashboard..." />;
    }

    if (!panelData || groups.length === 0 || !selectedGroup) {
        return (
            <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
                <div className="text-center p-8 bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--glass-border)] shadow-xl max-w-md w-full">
                    <div className="w-20 h-20 bg-[var(--color-bg-tertiary)] rounded-full flex items-center justify-center mx-auto mb-6">
                        <MdPending className="w-10 h-10 text-mindSaga-400 animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                        Evaluation Completed / Waiting
                    </h2>
                    <p className="text-[var(--color-text-muted)] mb-8">
                        You have evaluated all assigned groups. Please wait for the administrator to assign the next group.
                    </p>
                    <Button variant="outline" onClick={() => fetchPanelData(judgeSession.accessCode)} className="w-full">
                        <MdRefresh className="w-4 h-4 mr-2" />
                        Check for New Groups
                    </Button>
                    <div className="mt-4 border-t border-[var(--glass-border)] pt-4">
                        <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            {/* Header */}
            <div className="bg-[var(--color-bg-secondary)] border-b border-[var(--glass-border)] sticky top-0 z-50 backdrop-blur-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg border border-[var(--glass-border)] bg-white p-1">
                                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] font-display">
                                    {panelData.panel.panelName}
                                </h1>
                                <p className="text-sm text-[var(--color-text-secondary)]">
                                    Judge: {judgeSession.judgeName} • {panelData.panel.subEvent?.name} - {panelData.panel.round?.name}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <ThemeToggle />
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-status-busy/20 hover:text-status-busy transition-smooth"
                            >
                                <MdLogout className="w-5 h-5" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Groups Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-4 border border-[var(--glass-border)] sticky top-24">
                            <h3 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
                                Assigned Groups ({groups.length})
                            </h3>
                            <div className="space-y-2">
                                {groups.map((group, index) => (
                                    <motion.button
                                        key={group._id}
                                        onClick={() => {
                                            setSelectedGroup(group);
                                            loadEvaluation(judgeSession.accessCode, group._id, panelData.panel, group);
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-full p-3 rounded-lg text-left transition-all ${selectedGroup?._id === group._id
                                            ? 'bg-mindSaga-600 text-white shadow-lg'
                                            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]/80'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold">{group.groupName}</span>
                                            {group.evaluationStatus === 'completed' && (
                                                <MdCheckCircle className="w-5 h-5 text-status-available" />
                                            )}
                                        </div>
                                        <p className="text-xs opacity-80 mt-1">
                                            {group.participants?.length || 0} members
                                        </p>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Evaluation Form */}
                    <div className="lg:col-span-3">
                        {selectedGroup && evaluation && (
                            <motion.div
                                key={selectedGroup._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                { /* Group Info Card */}
                                <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 border border-[var(--glass-border)]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                                            {selectedGroup.groupName}
                                        </h2>
                                        <Button
                                            variant="outline"
                                            className="flex items-center gap-2 border-mindSaga-500 text-mindSaga-400 hover:bg-mindSaga-500/10"
                                            onClick={() => setShowTopicSpinner(true)}
                                        >
                                            <MdAutoFixHigh className="w-5 h-5" />
                                            Topic Selection
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {selectedGroup.participants?.map((participant) => (
                                            <div
                                                key={participant._id}
                                                className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-tertiary)]"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-mindSaga-600 flex items-center justify-center text-white font-bold relative">
                                                    {participant.fullName.charAt(0)}
                                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-debate-500 rounded-full text-[10px] flex items-center justify-center shadow-lg border border-white">
                                                        {participant.chestNumber || '?'}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-[var(--color-text-primary)] truncate">
                                                        {participant.fullName}
                                                    </p>
                                                    <p className="text-xs text-[var(--color-text-muted)] truncate">
                                                        Chest No: {participant.chestNumber || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Participant Scoring Table */}
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                                        <MdPerson className="text-mindSaga-400" /> Member Performance Matrix
                                    </h3>

                                    <Card className="overflow-hidden border-0 shadow-xl">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-[var(--color-bg-tertiary)] border-b border-[var(--glass-border)]">
                                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)] min-w-[200px]">Group Member</th>
                                                        {evaluation.participantRatings?.[0]?.scores?.map((param, idx) => (
                                                            <th key={idx} className="px-4 py-4 text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)] text-center">
                                                                {param.parameterName}
                                                                <span className="block text-[8px] opacity-60">Max {param.maxScore}</span>
                                                            </th>
                                                        ))}
                                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)] text-right">Total Score</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--glass-border)]">
                                                    {evaluation.participantRatings?.length > 0 ? (
                                                        evaluation.participantRatings.map((rating) => (
                                                            <tr key={rating.participantId} className="hover:bg-white/5 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-mindSaga-600 flex items-center justify-center text-white text-xs font-bold shadow-inner relative">
                                                                            {rating.fullName ? rating.fullName.charAt(0) : '?'}
                                                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-debate-500 rounded-full text-[8px] flex items-center justify-center border border-white">
                                                                                {rating.participantId ? (selectedGroup.participants?.find(p => p._id === rating.participantId)?.chestNumber || '?') : '?'}
                                                                            </span>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-bold text-[var(--color-text-primary)] truncate max-w-[150px]">{rating.fullName || 'Unknown Participant'}</p>
                                                                            <p className="text-[10px] text-[var(--color-text-muted)]">Chest No: {selectedGroup.participants?.find(p => p._id === rating.participantId)?.chestNumber || 'N/A'}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                {rating.scores.map((score, sIdx) => (
                                                                    <td key={sIdx} className="px-4 py-4 text-center">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max={score.maxScore}
                                                                            value={score.score}
                                                                            onChange={(e) => handleParticipantScoreChange(rating.participantId, sIdx, e.target.value)}
                                                                            className="w-16 px-2 py-1.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-sm text-center font-bold text-mindSaga-400 focus:ring-1 focus:ring-mindSaga-500 outline-none"
                                                                        />
                                                                    </td>
                                                                ))}
                                                                <td className="px-6 py-4 text-right">
                                                                    <span className="text-lg font-black text-mindSaga-400">
                                                                        {rating.totalScore.toFixed(1)}
                                                                    </span>
                                                                    <span className="text-[10px] text-[var(--color-text-muted)] ml-1">/ {rating.maxTotalScore}</span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="100%" className="px-6 py-8 text-center text-[var(--color-text-muted)] italic text-sm">
                                                                No participants found in this group
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>
                                </div>

                                {/* Next Round Eligibility Section */}
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                                        <MdStar className="text-status-available" /> Next Round Nominations
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {evaluation.participantRatings.map((rating) => (
                                            <Card
                                                key={rating.participantId}
                                                className={`p-4 cursor-pointer transition-all border-2 ${rating.selectedForNextRound ? 'border-status-available bg-status-available/5' : 'border-transparent hover:border-mindSaga-500/30'}`}
                                                onClick={() => handleParticipantSelection(rating.participantId, !rating.selectedForNextRound)}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-lg ${rating.selectedForNextRound ? 'bg-status-available' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'}`}>
                                                            {rating.selectedForNextRound ? <MdCheckCircle className="w-6 h-6" /> : (rating.fullName ? rating.fullName.charAt(0) : '?')}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-[var(--color-text-primary)]">{rating.fullName || 'Unknown Participant'}</p>
                                                            <p className="text-[10px] text-[var(--color-text-muted)]">Chest No: {selectedGroup.participants?.find(p => p._id === rating.participantId)?.chestNumber || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${rating.selectedForNextRound ? 'bg-status-available border-status-available' : 'border-[var(--glass-border)]'}`}>
                                                        {rating.selectedForNextRound && <MdCheckCircle className="w-4 h-4 text-white" />}
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                {/* Summary Card */}
                                <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 border border-mindSaga-500/30 flex items-center justify-between shadow-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-mindSaga-600/10 flex items-center justify-center text-mindSaga-400">
                                            <MdStar className="w-10 h-10" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-mindSaga-400 uppercase tracking-tighter">Live Group Rank Score</p>
                                            <p className="text-4xl font-black text-[var(--color-text-primary)]">
                                                {calculateOverallTotal()}<span className="text-lg ml-1 font-bold opacity-40">%</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-status-available uppercase tracking-tighter">Total Selected</p>
                                        <p className="text-4xl font-black text-status-available">
                                            {evaluation.participantRatings.filter(p => p.selectedForNextRound).length}
                                            <span className="text-lg ml-1 font-bold text-[var(--color-text-muted)]">/ {evaluation.participantRatings.length}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSubmit(true)}
                                        className="flex-1 py-4 rounded-xl bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] font-bold flex items-center justify-center gap-2 hover:bg-[var(--color-bg-tertiary)]/80 transition-all"
                                    >
                                        <MdSave className="w-5 h-5" />
                                        Save Draft
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSubmit(false)}
                                        className="flex-1 py-4 rounded-xl bg-gradient-to-r from-mindSaga-600 to-debate-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-mindSaga-500/50 transition-all"
                                    >
                                        <MdSend className="w-5 h-5" />
                                        Submit Evaluation
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showTopicSpinner && (
                    <TopicSpinner
                        accessCode={judgeSession.accessCode}
                        groupId={selectedGroup._id}
                        subEventId={panelData.panel.subEvent?._id}
                        onTopicClaimed={(topic) => {
                            // Optionally update local state if we want to show it somewhere else too
                            console.log('Claimed topic:', topic);
                        }}
                        onClose={() => setShowTopicSpinner(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default JudgeDashboard;
