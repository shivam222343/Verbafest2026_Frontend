import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdCheckCircle, MdPending, MdStar, MdGroup, MdPerson,
    MdThumbUp, MdDownload, MdRefresh, MdChevronRight, MdFilterList, MdSearch, MdInfo, MdClose, MdFileDownload
} from 'react-icons/md';
import axios from '../../lib/axios';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAdminSocket } from '../../hooks/useSocket';
import Loader from '../../components/ui/Loader';

const EvaluationOverview = ({ roundId, subEventId }) => {
    const [groups, setGroups] = useState([]);
    const [evaluations, setEvaluations] = useState([]);
    const [panels, setPanels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPanelId, setSelectedPanelId] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeView, setActiveView] = useState('summary'); // 'summary', 'participant-matrix', 'judge-view'
    const [nextRoundParticipants, setNextRoundParticipants] = useState([]);
    const [nextRoundNumber, setNextRoundNumber] = useState(null);

    // Socket.IO for real-time updates
    const handleEvaluationSubmitted = useCallback((data) => {
        console.log('Real-time evaluation update:', data);

        // Update evaluations list
        setEvaluations(prev => {
            const index = prev.findIndex(ev => ev.groupId === data.groupId && ev.judgeName === data.judgeName);
            if (index !== -1) {
                const updated = [...prev];
                updated[index] = { ...updated[index], ...data };
                return updated;
            }
            return [...prev, data];
        });

        // Update groups list
        setGroups(prev => prev.map(g =>
            g._id === data.groupId
                ? { ...g, evaluationStatus: data.evaluationStatus, averageScore: data.averageScore }
                : g
        ));

        toast.success(`${data.judgeName} submitted scores for ${data.groupName}`, {
            icon: '📊',
            position: 'bottom-right'
        });
    }, []);

    const socket = useAdminSocket({
        onEvaluationSubmitted: handleEvaluationSubmitted
    });

    useEffect(() => {
        if (roundId) {
            fetchData();
        }
    }, [roundId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [groupsRes, panelsRes, evalsRes, roundsRes] = await Promise.all([
                axios.get(`/admin/groups/round/${roundId}`),
                axios.get(`/admin/panels/round/${roundId}`),
                axios.get(`/admin/panels/round/${roundId}/evaluations`),
                axios.get(`/admin/rounds/subevent/${subEventId}`)
            ]);

            setGroups(groupsRes.data.data);
            setPanels(panelsRes.data.data);
            setEvaluations(evalsRes.data.data);

            // Find next round info
            const rounds = roundsRes.data.data;
            const currentRound = rounds.find(r => r._id === roundId);
            if (currentRound) {
                const next = rounds.find(r => r.roundNumber === currentRound.roundNumber + 1);
                if (next) {
                    setNextRoundParticipants(next.participants?.map(p => p._id) || []);
                    setNextRoundNumber(next.roundNumber);
                }
            }
        } catch (error) {
            console.error('Failed to fetch evaluation data:', error);
            toast.error('Failed to load real-time scores');
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const total = groups.length;
        const completed = groups.filter(g => g.evaluationStatus === 'completed').length;
        const inProgress = groups.filter(g => g.evaluationStatus === 'in_progress').length;
        const pending = groups.filter(g => g.evaluationStatus === 'pending' || !g.evaluationStatus).length;

        return { total, completed, inProgress, pending };
    }, [groups]);

    const filteredGroups = useMemo(() => {
        return groups.filter(g => {
            const matchesPanel = selectedPanelId === 'all' || g.panelId === selectedPanelId;
            const matchesSearch = g.groupName.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesPanel && matchesSearch;
        }).sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
    }, [groups, selectedPanelId, searchQuery]);

    const getGroupEvaluations = (groupId) => {
        return evaluations.filter(ev => ev.groupId === groupId);
    };

    const getStatusBadge = (status) => {
        const badges = {
            completed: {
                bg: 'bg-status-available/20',
                text: 'text-status-available',
                icon: <MdCheckCircle className="w-4 h-4" />,
                label: 'Completed'
            },
            in_progress: {
                bg: 'bg-debate-400/20',
                text: 'text-debate-400',
                icon: <MdPending className="w-4 h-4" />,
                label: 'Evaluating'
            }
        };

        const badge = badges[status] || {
            bg: 'bg-[var(--color-bg-tertiary)]',
            text: 'text-[var(--color-text-muted)]',
            icon: <MdPending className="w-4 h-4" />,
            label: 'Pending'
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${badge.bg} ${badge.text} text-xs font-bold uppercase tracking-wider`}>
                {badge.icon}
                {badge.label}
            </span>
        );
    };

    const handlePromoteSelected = async () => {
        if (!window.confirm('This will move all students nominated by judges to the next round. Continue?')) return;

        try {
            setLoading(true);
            const response = await axios.post(`/admin/rounds/${roundId}/promote-selected`);
            if (response.data.success) {
                toast.success(response.data.message);
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to promote students');
        } finally {
            setLoading(false);
        }
    };

    const handleExportWinners = async (format) => {
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

    if (!roundId) {
        return (
            <Card className="p-12 text-center border-dashed border-2 border-[var(--glass-border)]">
                <MdGroup className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">No Round Selected</h3>
                <p className="text-[var(--color-text-muted)]">Please select a round from the selector above to monitor performance.</p>
            </Card>
        );
    }

    if (loading) {
        return <Loader message="Connecting to live evaluation stream..." />;
    }

    return (
        <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-gradient-to-br from-mindSaga-600/10 to-transparent border-mindSaga-500/20">
                    <p className="text-xs font-bold text-mindSaga-400 uppercase mb-1">Total Groups</p>
                    <p className="text-2xl font-black text-[var(--color-text-primary)]">{stats.total}</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-status-available/10 to-transparent border-status-available/20">
                    <p className="text-xs font-bold text-status-available uppercase mb-1">Completed</p>
                    <p className="text-2xl font-black text-status-available">{stats.completed}</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-debate-400/10 to-transparent border-debate-400/20">
                    <p className="text-xs font-bold text-debate-400 uppercase mb-1">In Progress</p>
                    <p className="text-2xl font-black text-debate-400">{stats.inProgress}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase mb-1">Awaiting</p>
                    <p className="text-2xl font-black text-[var(--color-text-primary)]">{stats.pending}</p>
                </Card>
            </div>

            {/* View Controls */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-[var(--color-bg-secondary)] p-4 rounded-2xl border border-[var(--glass-border)]">
                <div className="flex gap-2 p-1 bg-[var(--color-bg-tertiary)] rounded-xl w-full lg:w-auto">
                    <button
                        onClick={() => setActiveView('summary')}
                        className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-smooth ${activeView === 'summary' ? 'bg-mindSaga-600 text-white shadow-lg' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
                    >
                        Leaderboard
                    </button>
                    <button
                        onClick={() => setActiveView('participant-matrix')}
                        className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-smooth ${activeView === 'participant-matrix' ? 'bg-mindSaga-600 text-white shadow-lg' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
                    >
                        Participant Matrix
                    </button>
                    <button
                        onClick={() => setActiveView('judge-view')}
                        className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-smooth ${activeView === 'judge-view' ? 'bg-mindSaga-600 text-white shadow-lg' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
                    >
                        Judge Details
                    </button>
                </div>

                <div className="flex gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-64">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search group..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-sm focus:outline-none focus:ring-2 focus:ring-mindSaga-500"
                        />
                    </div>
                    <select
                        value={selectedPanelId}
                        onChange={(e) => setSelectedPanelId(e.target.value)}
                        className="px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-sm focus:outline-none cursor-pointer"
                    >
                        <option value="all">All Panels</option>
                        {panels.map(p => <option key={p._id} value={p._id}>{p.panelName}</option>)}
                    </select>
                </div>
            </div>

            {/* Live Leaderboard */}
            {activeView === 'summary' ? (
                <Card className="overflow-hidden border-0 shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[var(--color-bg-tertiary)] border-b border-[var(--glass-border)]">
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)]">Rank</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)]">Group Name</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)] text-center">Average Score</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)]">Progress</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)] text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--glass-border)]">
                                {filteredGroups.map((group, index) => {
                                    const groupEvals = getGroupEvaluations(group._id);
                                    const panel = panels.find(p => p._id === group.panelId);
                                    const totalJudges = panel?.judges.length || 1;

                                    return (
                                        <motion.tr
                                            key={group._id}
                                            layout
                                            className="hover:bg-white/5 transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-sm ${index < 3 ? 'bg-mindSaga-600 text-white' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'}`}>
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-[var(--color-text-primary)]">
                                                {group.groupName}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-xl font-black ${group.averageScore >= 80 ? 'text-status-available' : group.averageScore >= 60 ? 'text-debate-400' : 'text-status-busy'}`}>
                                                    {group.averageScore ? group.averageScore.toFixed(1) : '-'}
                                                </span>
                                                <span className="text-xs text-[var(--color-text-muted)] ml-1">%</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 bg-[var(--color-bg-tertiary)] rounded-full h-1.5 overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(groupEvals.length / totalJudges) * 100}%` }}
                                                            className="h-full bg-mindSaga-500"
                                                        />
                                                    </div>
                                                    <span className="text-xs font-mono font-bold text-[var(--color-text-muted)]">
                                                        {groupEvals.length}/{totalJudges}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {getStatusBadge(group.evaluationStatus)}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : activeView === 'participant-matrix' ? (
                /* Participant Selection Matrix */
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[var(--color-bg-tertiary)] border-b border-[var(--glass-border)]">
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)]">Student Name</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)]">Group</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)] text-center">Avg Score</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)] text-center">Nominations</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)] text-right">Selection Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--glass-border)]">
                                {filteredGroups.flatMap(group => (group.participants || []).map(p => {
                                    const studentEvals = evaluations.filter(ev => ev.groupId === group._id);
                                    const participantScores = studentEvals.flatMap(ev =>
                                        (ev.participantRatings || []).filter(pr => pr.participantId === p._id)
                                    );

                                    const avgScore = participantScores.length > 0
                                        ? participantScores.reduce((sum, pr) => sum + (pr.totalScore / (pr.maxTotalScore || 1) * 100), 0) / participantScores.length
                                        : 0;

                                    const nominations = participantScores.filter(pr => pr.selectedForNextRound).length;
                                    const totalPanelJudges = panels.find(pan => pan._id === group.panelId)?.judges.length || 0;

                                    return (
                                        <tr key={p._id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded bg-debate-500 flex items-center justify-center text-white text-[10px] font-bold">
                                                        {p.chestNumber || '?'}
                                                    </span>
                                                    <div>
                                                        <p className="font-bold text-[var(--color-text-primary)]">{p.fullName}</p>
                                                        <p className="text-[10px] text-[var(--color-text-muted)]">Chest No: {p.chestNumber || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-mindSaga-400">{group.groupName}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`font-black ${avgScore >= 80 ? 'text-status-available' : avgScore >= 60 ? 'text-debate-400' : 'text-status-busy'}`}>
                                                    {avgScore > 0 ? avgScore.toFixed(1) : '-'}
                                                </span>
                                                {avgScore > 0 && <span className="text-[10px] text-[var(--color-text-muted)] ml-0.5">%</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="flex -space-x-2">
                                                        {[...Array(totalPanelJudges)].map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className={`w-4 h-4 rounded-full border border-[var(--color-bg-primary)] ${i < nominations ? 'bg-status-available' : 'bg-[var(--color-bg-tertiary)]'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs font-bold text-[var(--color-text-primary)]">
                                                        {nominations}/{totalPanelJudges}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    {nextRoundParticipants.includes(p._id) ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-status-available/20 text-[10px] font-black text-status-available uppercase border border-status-available/30">
                                                            <MdCheckCircle className="w-3 h-3" /> Eligible for Rd {nextRoundNumber}
                                                        </span>
                                                    ) : nominations > 0 ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-mindSaga-600/20 text-[10px] font-black text-mindSaga-400 uppercase border border-mindSaga-500/30">
                                                            <MdThumbUp className="w-3 h-3" /> Nominated
                                                        </span>
                                                    ) : studentEvals.length > 0 ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-status-busy/20 text-[10px] font-black text-status-busy uppercase border border-status-busy/30">
                                                            <MdClose className="w-3 h-3" /> Eliminated
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase italic">
                                                            Awaiting Evaluation
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-[var(--color-bg-tertiary)] flex justify-end gap-3 border-t border-[var(--glass-border)]">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportWinners('csv')}
                        >
                            <MdFileDownload className="mr-2" /> CSV
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportWinners('html')}
                        >
                            <MdFileDownload className="mr-2" /> HTML
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportWinners('pdf')}
                        >
                            <MdFileDownload className="mr-2" /> PDF
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handlePromoteSelected}
                            className="bg-mindSaga-600 hover:bg-mindSaga-700"
                        >
                            <MdThumbUp className="w-4 h-4 mr-2" />
                            Promote All Nominated Students
                        </Button>
                    </div>
                </Card>
            ) : (
                /* Detailed Judge Matrix */
                <div className="grid grid-cols-1 gap-6">
                    {filteredGroups.map(group => {
                        const groupEvals = getGroupEvaluations(group._id);
                        const panel = panels.find(p => p._id === group.panelId);

                        return (
                            <Card key={group._id} className="p-0 overflow-hidden border-mindSaga-500/10">
                                <div className="p-4 bg-[var(--color-bg-tertiary)] flex justify-between items-center border-b border-[var(--glass-border)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-mindSaga-600/20 flex items-center justify-center text-mindSaga-400">
                                            <MdGroup className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-[var(--color-text-primary)]">{group.groupName}</h3>
                                            <p className="text-xs text-[var(--color-text-muted)]">{panel?.panelName || 'Unassigned'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-tighter">Live Aggregate</p>
                                        <p className="text-2xl font-black text-mindSaga-400">{group.averageScore ? group.averageScore.toFixed(1) : '0.0'}%</p>
                                    </div>
                                </div>
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {panel?.judges.map(judge => {
                                        const evalData = groupEvals.find(e => e.judgeEmail === judge.email);
                                        return (
                                            <div key={judge.email} className={`p-4 rounded-xl border ${evalData ? 'bg-mindSaga-600/5 border-mindSaga-500/30' : 'bg-transparent border-[var(--glass-border)] opacity-60'}`}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-xs font-bold">
                                                            {judge.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-[var(--color-text-primary)]">{judge.name}</p>
                                                            <p className="text-[10px] text-[var(--color-text-muted)]">{evalData ? 'Evaluated' : 'Awaiting'}</p>
                                                        </div>
                                                    </div>
                                                    {evalData && (
                                                        <div className="text-right">
                                                            <span className="text-lg font-black text-mindSaga-400">{evalData.percentage.toFixed(0)}%</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {evalData ? (
                                                    <div className="space-y-4">
                                                        {/* Individual Participant Scores from this Judge */}
                                                        <div className="space-y-2">
                                                            <p className="text-[10px] font-bold text-mindSaga-400 uppercase tracking-tighter">Student Performance</p>
                                                            {(evalData.participantRatings || []).map(pr => (
                                                                <div key={pr.participantId} className="p-2 rounded bg-[var(--color-bg-primary)] border border-mindSaga-500/10">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <span className="text-[11px] font-bold text-[var(--color-text-primary)] truncate max-w-[120px]">
                                                                            {pr.fullName || 'Student'}
                                                                        </span>
                                                                        {pr.selectedForNextRound ? (
                                                                            <MdCheckCircle className="w-3 h-3 text-status-available" />
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-status-busy/10 text-[8px] font-black text-status-busy uppercase border border-status-busy/20">
                                                                                <MdClose className="w-2.5 h-2.5" /> Eliminated
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex justify-between items-center">
                                                                        <div className="flex-1 h-1 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden mr-2">
                                                                            <div
                                                                                className="h-full bg-mindSaga-500"
                                                                                style={{ width: `${(pr.totalScore / (pr.maxTotalScore || 1)) * 100}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-[10px] font-black text-mindSaga-400">
                                                                            {pr.totalScore}/{pr.maxTotalScore}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {evalData.comments && (
                                                            <div className="mt-3 p-2 bg-[var(--color-bg-primary)] rounded text-[10px] text-[var(--color-text-secondary)] italic border border-[var(--glass-border)]">
                                                                "{evalData.comments}"
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center py-8">
                                                        <MdPending className="w-8 h-8 text-[var(--color-bg-tertiary)] animate-pulse" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default EvaluationOverview;
