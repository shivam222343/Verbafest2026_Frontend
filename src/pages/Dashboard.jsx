import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdPeople, MdEventNote, MdCheckCircle, MdPending, MdPersonAdd, MdCheck, MdClose, MdNotificationsActive } from 'react-icons/md';
import { FiUsers, FiClock } from 'react-icons/fi';
import { HiOutlineClipboardCheck } from 'react-icons/hi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { useAdminSocket } from '../hooks/useSocket';

const Dashboard = () => {
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingAdmins, setPendingAdmins] = useState([]);

    const fetchPendingAdmins = useCallback(async () => {
        try {
            const response = await axios.get('/admin/users/pending');
            setPendingAdmins(response.data.data);
        } catch (error) {
            console.error('Failed to fetch pending admins:', error);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('/admin/analytics');
            setStatsData(response.data.data);
        } catch (error) {
            console.log('Analytics endpoint not available yet, using default values');
            setStatsData({
                totalParticipants: 0,
                totalSubEvents: 0,
                approvedParticipants: 0
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        fetchPendingAdmins();
    }, [fetchStats, fetchPendingAdmins]);

    // Socket for real-time admin requests
    useAdminSocket({
        onAdminRequest: (data) => {
            setPendingAdmins(prev => {
                if (prev.find(a => a._id === data.id)) return prev;
                return [...prev, { ...data, _id: data.id }];
            });
            toast('New admin access request received!', {
                icon: '👤',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
        }
    });

    const handleApproveAdmin = async (id) => {
        try {
            await axios.put(`/admin/users/${id}/approve`);
            toast.success('Admin access approved!');
            setPendingAdmins(prev => prev.filter(adm => adm._id !== id));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve admin');
        }
    };

    const handleRejectAdmin = async (id) => {
        if (!window.confirm('Are you sure you want to reject this admin request?')) return;
        try {
            await axios.delete(`/admin/users/${id}`);
            toast.success('Admin request rejected');
            setPendingAdmins(prev => prev.filter(adm => adm._id !== id));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject admin');
        }
    };

    const stats = [
        {
            title: 'Total Participants',
            value: statsData?.totalParticipants || '0',
            icon: FiUsers,
            color: 'mindSaga',
            change: '+0%'
        },
        {
            title: 'Active Sub-Events',
            value: statsData?.totalSubEvents || '0',
            icon: MdEventNote,
            color: 'gd',
            change: '+0%'
        },
        {
            title: 'Pending Approvals',
            value: (statsData?.totalParticipants || 0) - (statsData?.approvedParticipants || 0) || '0',
            icon: MdPending,
            color: 'debate',
            change: '0'
        },
        {
            title: 'Active Rounds',
            value: statsData?.activeRounds || '0',
            icon: FiClock,
            color: 'status-available',
            change: '0'
        }
    ];

    const recentActivity = [
        { type: 'info', message: 'System healthy', time: 'Live' },
        { type: 'success', message: 'Database connected', time: 'Active' },
    ];

    if (loading) {
        return <Loader message="Analyzing event data..." />;
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-[var(--color-text-secondary)] mt-1 flex items-center gap-2">
                        Welcome to <span className="text-mindSaga-400 font-bold">Event Orchestration Platform</span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-available/10 text-status-available text-xs font-bold border border-status-available/20">
                        <div className="w-2 h-2 rounded-full bg-status-available animate-pulse" />
                        Live Monitoring Active
                    </span>
                </div>
            </div>

            {/* Admin Approval Section (New User Real-time) */}
            <AnimatePresence>
                {pendingAdmins.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <Card className="p-0 border-l-4 border-l-debate-500 bg-debate-500/5 relative">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-debate-500 text-white shadow-lg shadow-debate-500/20">
                                            <MdNotificationsActive className="w-6 h-6 animate-bounce" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Admin Access Requests</h2>
                                            <p className="text-sm text-[var(--color-text-secondary)]">New users are waiting for your approval to access the panel.</p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-md bg-debate-500 text-white text-xs font-black uppercase tracking-widest leading-none">
                                        {pendingAdmins.length} New
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {pendingAdmins.map((adm) => (
                                        <motion.div
                                            key={adm._id}
                                            layout
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="p-4 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--glass-border)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-full bg-gd-500/10 flex items-center justify-center text-gd-500 border border-gd-500/20">
                                                    <MdPersonAdd className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-[var(--color-text-primary)] truncate">{adm.name}</p>
                                                    <p className="text-xs text-[var(--color-text-muted)] truncate">{adm.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApproveAdmin(adm._id)}
                                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-status-available text-white text-xs font-bold hover:bg-status-available/90 transition-colors"
                                                >
                                                    <MdCheck className="w-4 h-4" /> Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRejectAdmin(adm._id)}
                                                    className="flex items-center justify-center p-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:bg-status-busy hover:text-white transition-colors"
                                                >
                                                    <MdClose className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card hover={false} className="p-6 transition-smooth group hover:scale-[1.02] border-t-2 border-t-transparent hover:border-t-mindSaga-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-[var(--color-text-muted)] mb-1 uppercase tracking-widest">
                                        {stat.title}
                                    </p>
                                    <h3 className="text-3xl font-black text-[var(--color-text-primary)]">
                                        {stat.value}
                                    </h3>
                                    <div className="flex items-center gap-1 mt-2">
                                        <span className={`text-[10px] font-bold ${stat.change.startsWith('+') ? 'text-status-available' : 'text-status-busy'}`}>
                                            {stat.change}
                                        </span>
                                        <span className="text-[10px] text-[var(--color-text-muted)] uppercase">v/s last wk</span>
                                    </div>
                                </div>
                                <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center group-hover:bg-${stat.color}-500 group-hover:text-white transition-all duration-300 shadow-inner`}>
                                    <stat.icon className={`w-7 h-7 text-${stat.color}-500 group-hover:text-white`} />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-1"
                >
                    <Card className="p-6 h-full">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-mindSaga-500 rounded-full" />
                            Quick Actions
                        </h2>
                        <div className="space-y-3">
                            <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-tertiary)] hover:bg-mindSaga-600 hover:text-white transition-all duration-300 text-left border border-[var(--glass-border)] group shadow-sm">
                                <MdEventNote className="w-6 h-6 text-mindSaga-500 group-hover:text-white" />
                                <span className="text-sm font-bold">Create Sub-Event</span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-tertiary)] hover:bg-gd-600 hover:text-white transition-all duration-300 text-left border border-[var(--glass-border)] group shadow-sm">
                                <HiOutlineClipboardCheck className="w-6 h-6 text-gd-500 group-hover:text-white" />
                                <span className="text-sm font-bold">Review Registrations</span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-tertiary)] hover:bg-debate-600 hover:text-white transition-all duration-300 text-left border border-[var(--glass-border)] group shadow-sm">
                                <MdPeople className="w-6 h-6 text-debate-500 group-hover:text-white" />
                                <span className="text-sm font-bold">View Participants</span>
                            </button>
                        </div>
                    </Card>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-2"
                >
                    <Card className="p-6 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-gd-500 rounded-full" />
                                Recent Activity
                            </h2>
                            <button className="text-xs font-bold text-mindSaga-400 hover:underline">View All</button>
                        </div>
                        <div className="space-y-4">
                            {recentActivity.map((activity, index) => (
                                <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--color-bg-tertiary)] transition-colors group">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activity.type === 'success' ? 'bg-status-available/10 text-status-available' : 'bg-mindSaga-500/10 text-mindSaga-500'
                                        }`}>
                                        <MdCheckCircle className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                            {activity.message}
                                        </p>
                                        <p className="text-[10px] text-[var(--color-text-muted)] font-black uppercase tracking-wider mt-0.5">
                                            {activity.time}
                                        </p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MdPeople className="text-[var(--color-text-muted)]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* System Status */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <Card className="p-6 bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-primary)]">
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-status-available rounded-full" />
                        System Health
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { label: 'Backend API', status: 'Running', sub: 'Lat: 12ms' },
                            { label: 'Database', status: 'Connected', sub: 'Replica: Active' },
                            { label: 'Real-time', status: 'Active', sub: 'Sockets: 2' }
                        ].map((stat, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--glass-border)] shadow-sm">
                                <div className="w-3 h-3 rounded-full bg-status-available animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                <div>
                                    <p className="text-sm font-black text-[var(--color-text-primary)] uppercase tracking-tight">{stat.label}</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xs font-bold text-status-available">{stat.status}</span>
                                        <span className="text-[10px] text-[var(--color-text-muted)]">{stat.sub}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};

export default Dashboard;
