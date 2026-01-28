import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    MdLogout, MdEvent, MdCheckCircle, MdPerson, MdLightMode, MdDarkMode,
    MdInfo, MdTimer, MdLocationOn, MdRefresh, MdAnnouncement, MdNotifications
} from 'react-icons/md';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { useParticipantSocket } from '../hooks/useSocket';
import Loader from '../components/ui/Loader';
import BottomSheet from '../components/ui/BottomSheet';
import useNotificationStore from '../store/notificationStore';

const ParticipantDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { theme } = useThemeStore();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const { notifications, unreadCount, addNotification, markAllAsRead, clearNotifications } = useNotificationStore();

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get('/participant/me');
            setProfile(res.data.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Setup real-time updates
    const subEventIds = useMemo(() =>
        profile?.registeredSubEvents?.map(e => e._id) || [],
        [profile?.registeredSubEvents]
    );
    useParticipantSocket(user?.id, subEventIds, {
        onStatusUpdated: (data) => {
            toast.success(`Broadcasting Update: ${data.message}`, { icon: '📢', duration: 5000 });
            fetchDashboardData();
        },
        onRoundStarted: (data) => {
            toast.success(`The round "${data.name}" has started!`, { icon: '🚀', duration: 6000 });
            fetchDashboardData();
        },
        onRoundEnded: (data) => {
            toast.info(`The round "${data.name}" has ended.`, { icon: '🏁' });
            fetchDashboardData();
        },
        onNotificationReceived: (data) => {
            console.log('🔔 Notification received:', data);
            addNotification({
                ...data,
                id: data.id || Date.now().toString(),
                timestamp: data.timestamp || new Date()
            });
            toast.success(data.title, { icon: '🔔' });
            fetchDashboardData();
        }
    });

    useEffect(() => {
        if (isNotificationOpen && unreadCount > 0) {
            markAllAsRead();
        }
    }, [isNotificationOpen, unreadCount, markAllAsRead]);

    const handleLogout = () => {
        logout();
        navigate('/participant/login');
    };

    if (loading) {
        return <Loader fullScreen message="Loading your dashboard..." />;
    }

    const registeredEvents = profile?.registeredSubEvents || [];
    const activeRounds = registeredEvents.filter(e => e.currentRound && e.currentRound.status === 'active');

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] transition-colors duration-300">
            {/* Navbar */}
            <nav className="glass-strong border-b border-[var(--glass-border)] sticky top-0 z-50">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left Section - Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg border border-[var(--glass-border)] bg-white p-1">
                                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                    Verbafest 2026
                                </h1>
                                <p className="text-xs text-[var(--color-text-muted)]">Participant Dashboard</p>
                            </div>
                        </div>

                        {/* Right Section - Actions */}
                        <div className="flex items-center gap-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => useThemeStore.getState().toggleTheme()}
                                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-smooth"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? (
                                    <MdLightMode className="w-5 h-5 text-[var(--color-text-primary)]" />
                                ) : (
                                    <MdDarkMode className="w-5 h-5 text-[var(--color-text-primary)]" />
                                )}
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setIsNotificationOpen(true);
                                    markAllAsRead();
                                }}
                                className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-smooth"
                                aria-label="Notifications"
                            >
                                <MdNotifications className="w-5 h-5 text-[var(--color-text-primary)]" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-status-busy text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                                        {unreadCount}
                                    </span>
                                )}
                            </motion.button>

                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)]">
                                <div className="w-8 h-8 rounded-full bg-gd-600 flex items-center justify-center">
                                    <MdPerson className="w-4 h-4 text-white" />
                                </div>
                                <span className="hidden md:block text-sm font-medium text-[var(--color-text-primary)]">
                                    {profile?.fullName || 'Participant'}
                                </span>
                            </div>

                            <Button
                                variant="ghost"
                                onClick={handleLogout}
                                className="flex items-center gap-2"
                            >
                                <MdLogout className="w-5 h-5" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto p-6 space-y-8">
                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">
                            Welcome, {profile?.fullName.split(' ')[0]}!
                        </h2>
                        <p className="text-[var(--color-text-secondary)] mt-1">
                            {profile?.registrationStatus === 'approved'
                                ? 'Track your event progress and receive real-time updates.'
                                : 'Your account set up is almost complete.'}
                        </p>
                    </div>
                    {profile?.registrationStatus === 'approved' && (
                        <Button variant="outline" onClick={fetchDashboardData} className="flex items-center gap-2">
                            <MdRefresh className="w-4 h-4" /> Refresh Status
                        </Button>
                    )}
                </div>

                {/* Conditional Rendering Based on Status */}
                {profile?.registrationStatus === 'pending' || profile?.registrationStatus === 'incomplete' ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <Card className="p-12 text-center border-l-8 border-l-amber-500 bg-amber-500/5 relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <MdInfo className="w-10 h-10 text-amber-500 animate-pulse" />
                                </div>
                                <h3 className="text-2xl font-black text-[var(--color-text-primary)] mb-4">Registration Under Review</h3>
                                <p className="text-[var(--color-text-secondary)] max-w-lg mx-auto leading-relaxed">
                                    Thank you for registering for <span className="text-mindSaga-400 font-bold">Verbafest 2026</span>! Your application and payment proof are currently being verified by our administrators.
                                </p>
                                <div className="mt-8 p-6 bg-[var(--color-bg-tertiary)] rounded-2xl border border-[var(--glass-border)] inline-block text-left">
                                    <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-4">What Happens Next?</h4>
                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                                            <MdCheckCircle className="text-amber-500 w-5 h-5 shrink-0" />
                                            Admin verifies your transaction ID and proof.
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                                            <MdCheckCircle className="text-amber-500 w-5 h-5 shrink-0" />
                                            Once approved, your dashboard will unlock fully.
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                                            <MdCheckCircle className="text-amber-500 w-5 h-5 shrink-0" />
                                            You'll be able to see your assigned rounds and venues.
                                        </li>
                                    </ul>
                                </div>
                                <div className="mt-8">
                                    <Button onClick={fetchDashboardData} variant="primary" className="flex items-center gap-2 mx-auto">
                                        <MdRefresh className="w-5 h-5" /> Check Status Again
                                    </Button>
                                </div>
                            </div>
                            {/* Background decoration */}
                            <MdEvent className="absolute -right-10 -bottom-10 w-64 h-64 text-amber-500/5 -rotate-12" />
                        </Card>
                    </motion.div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="p-5 border-l-4 border-mindSaga-500">
                                <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Registered</p>
                                <h3 className="text-2xl font-black text-mindSaga-400">{registeredEvents.length} Events</h3>
                            </Card>
                            <Card className="p-5 border-l-4 border-status-available">
                                <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Registration</p>
                                <h3 className={`text-2xl font-black capitalize ${profile?.registrationStatus === 'approved' ? 'text-status-available' : 'text-amber-500'}`}>
                                    {profile?.registrationStatus}
                                </h3>
                            </Card>
                            <Card className="p-5 border-l-4 border-debate-500">
                                <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Availability</p>
                                <h3 className={`text-2xl font-black capitalize ${profile?.currentStatus === 'available' ? 'text-status-available' : 'text-status-busy'}`}>
                                    {profile?.currentStatus}
                                </h3>
                            </Card>
                            <Card className="p-5 border-l-4 border-status-busy">
                                <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Active Rounds</p>
                                <h3 className="text-2xl font-black text-status-busy">{activeRounds.length} Ongoing</h3>
                            </Card>
                        </div>

                        {/* Active Competitions / Announcements */}
                        {activeRounds.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                                    <MdAnnouncement className="text-status-busy" /> Action Required / Live Now
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {activeRounds.map(event => (
                                        <Card key={event._id} className="p-6 bg-status-busy/5 border-status-busy/20 overflow-hidden relative">
                                            <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-status-busy text-white uppercase animate-pulse">Live</span>
                                                        <h4 className="text-xl font-bold text-[var(--color-text-primary)]">{event.name}</h4>
                                                    </div>
                                                    <p className="text-sm font-bold text-status-busy uppercase tracking-widest">{event.currentRound.name}</p>
                                                    <div className="flex flex-wrap gap-4 text-sm mt-3">
                                                        <span className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                                                            <MdLocationOn className="text-status-busy" /> {event.currentRound.venue}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                                                            <MdTimer className="text-status-busy" /> Round {event.currentRound.roundNumber}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="p-4 rounded-xl bg-status-busy/10 border border-status-busy/20 text-status-busy text-xs">
                                                        <p className="font-bold mb-1 uppercase">Instructions:</p>
                                                        <p className="italic">{event.currentRound.instructions || "Please report to the venue immediately."}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <MdAnnouncement className="absolute -right-4 -bottom-4 w-32 h-32 text-status-busy/5 -rotate-12" />
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All Registered Sub-Events */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                                <MdEvent className="text-mindSaga-500" /> Your Events
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {registeredEvents.map(event => (
                                    <Card key={event._id} className="p-6 hover:shadow-xl transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-xl bg-${event.accentColor || 'mindSaga'}-500/10 text-${event.accentColor || 'mindSaga'}-500`}>
                                                <MdEvent className="w-6 h-6" />
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${event.myStatus === 'winner' ? 'bg-status-available/20 text-status-available border border-status-available/30' :
                                                event.myStatus === 'eliminated' ? 'bg-status-busy/20 text-status-busy border border-status-busy/30' :
                                                    event.myStatus === 'active' || event.myStatus === 'started' ? 'bg-gd-500/20 text-gd-400 border border-gd-500/30' :
                                                        event.myStatus === 'qualified' ? 'bg-status-available/20 text-status-available border border-status-available/30' :
                                                            'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] border border-[var(--glass-border)]'
                                                }`}>
                                                {event.myStatus === 'active' || event.myStatus === 'started' ? `Round ${event.myRoundNumber}` : event.myStatus.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <h4 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-mindSaga-400 transition-colors">
                                            {event.name}
                                        </h4>
                                        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4">
                                            {event.description}
                                        </p>
                                        <div className="pt-4 border-t border-[var(--glass-border)] flex items-center justify-between text-xs font-bold text-[var(--color-text-muted)]">
                                            <span className="uppercase tracking-widest">{event.type} Event</span>
                                            <span className={`uppercase tracking-widest ${event.status === 'completed' ? 'text-status-available' : 'text-mindSaga-400'}`}>
                                                {event.status === 'completed' ? 'Finished' : 'Upcoming'}
                                            </span>
                                        </div>
                                    </Card>
                                ))}

                                {registeredEvents.length === 0 && (
                                    <div className="col-span-full py-20 bg-[var(--color-bg-tertiary)] rounded-3xl border-2 border-dashed border-[var(--glass-border)] flex flex-col items-center justify-center text-center px-4">
                                        <MdEvent className="w-12 h-12 text-[var(--color-text-muted)] mb-4" />
                                        <h3 className="text-lg font-bold text-[var(--color-text-primary)]">No Registered Events</h3>
                                        <p className="text-[var(--color-text-secondary)] max-w-sm mt-2">
                                            You haven't registered for any sub-events yet. Head over to the registration portal to join the excitement!
                                        </p>
                                        <Button className="mt-6" onClick={() => navigate('/registration')}>Go to Registration</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Notification Bottom Sheet */}
            <BottomSheet
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                title="Notifications"
            >
                <div className="space-y-4">
                    {notifications.length > 0 ? (
                        <>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Recent Activity</span>
                            </div>
                            {notifications.map((notif) => (
                                <Card key={notif.id} className="p-4 border-l-4 border-l-mindSaga-500 bg-mindSaga-500/5">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-[var(--color-text-primary)]">{notif.title}</h4>
                                        <span className="text-[10px] text-[var(--color-text-muted)]">
                                            {notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[var(--color-text-secondary)] mb-2">{notif.message}</p>
                                    {notif.location && (
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-mindSaga-400">
                                            <MdLocationOn className="w-4 h-4" />
                                            Venue: {notif.location}
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </>
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                            <MdNotifications className="w-16 h-16 mb-4" />
                            <p className="font-bold">No notifications yet</p>
                            <p className="text-sm">You'll see real-time updates here</p>
                        </div>
                    )}
                </div>
            </BottomSheet>
        </div>
    );
};

export default ParticipantDashboard;
