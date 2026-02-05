import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from '../lib/axios';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import { MdEmojiEvents, MdPeople, MdArrowForward, MdInfo } from 'react-icons/md';

const PublicSubEventsPage = () => {
    const [subEvents, setSubEvents] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [settingsRes, subEventsRes] = await Promise.all([
                axios.get('/registration/settings'),
                axios.get('/registration/form')
            ]);
            setSettings(settingsRes.data.data);
            setSubEvents(subEventsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch public data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loader message="Opening the arena..." />;
    }

    if (!settings?.showSubEventsOnPublicPage) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-bg-primary)]">
                <Card className="max-w-md p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-status-busy/10 flex items-center justify-center text-status-busy mx-auto">
                        <MdInfo className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Arena Closed</h1>
                    <p className="text-[var(--color-text-secondary)]">
                        The list of sub-events is not currently public. Please check back later or contact the organizers.
                    </p>
                    <Button variant="primary" onClick={() => navigate('/register')} className="w-full">
                        Go to Registration
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
            {/* Banner Section */}
            <div className={`relative w-full overflow-hidden ${!settings.publicSubEventsBannerUrl ? 'h-[300px] md:h-[400px]' : ''}`}>
                {settings.publicSubEventsBannerUrl ? (
                    <img
                        src={settings.publicSubEventsBannerUrl}
                        alt="Event Banner"
                        className="w-full h-auto block"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-mindSaga-900 via-mindSaga-800 to-debate-900 flex items-center justify-center p-8 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl"
                        >
                            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter uppercase italic">
                                {settings.eventName || 'VERBAFEST 2026'}
                            </h1>
                            <p className="text-xl md:text-2xl text-mindSaga-300 font-medium"> Explore the Battleground of Minds </p>
                        </motion.div>
                    </div>
                )}
                {/* Overlay for readability if image exists */}
                {settings.publicSubEventsBannerUrl && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-8 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl"
                        >
                            <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter uppercase italic drop-shadow-2xl">
                                {settings.eventName || 'VERBAFEST 2026'}
                            </h1>
                            <p className="text-xl md:text-2xl text-white/90 font-bold drop-shadow-lg bg-black/20 backdrop-blur-sm px-4 py-1 rounded-full inline-block">
                                Explore the Battleground
                            </p>
                        </motion.div>
                    </div>
                )}
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-2">Sub-Events</h2>
                        <p className="text-[var(--color-text-secondary)]">Choose your challenge and prove your worth.</p>
                    </div>
                    {settings.isRegistrationOpen && (
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => navigate('/register')}
                            className="shadow-xl shadow-mindSaga-500/20"
                        >
                            Register Now <MdArrowForward className="ml-2 w-5 h-5" />
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {subEvents.map((event, idx) => (
                        <motion.div
                            key={event._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card className={`h-full group hover:border-mindSaga-500/50 transition-smooth overflow-hidden flex flex-col relative ${(event.maxParticipants > 0 && event.approvedParticipants >= event.maxParticipants) ? 'opacity-75 grayscale-[0.5]' : ''
                                }`}>
                                {event.maxParticipants > 0 && event.approvedParticipants >= event.maxParticipants && (
                                    <div className="absolute top-4 right-4 z-10 bg-status-busy text-white text-[10px] font-black px-2 py-1 rounded shadow-lg animate-pulse uppercase tracking-widest">
                                        Full
                                    </div>
                                )}
                                <div className={`h-2 bg-${event.accentColor || 'mindSaga'}-500`} />
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-xl bg-${event.accentColor || 'mindSaga'}-500/10 text-${event.accentColor || 'mindSaga'}-400`}>
                                            <MdEmojiEvents className="w-8 h-8" />
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-${event.accentColor || 'mindSaga'}-500/20 text-${event.accentColor || 'mindSaga'}-400`}>
                                            Individual
                                        </span>
                                    </div>

                                    <h3 className={`text-xl font-bold mb-3 transition-colors ${(event.maxParticipants > 0 && event.approvedParticipants >= event.maxParticipants)
                                        ? 'text-status-busy'
                                        : 'text-[var(--color-text-primary)] group-hover:text-mindSaga-400'
                                        }`}>
                                        {event.name}
                                    </h3>

                                    <p className="text-[var(--color-text-secondary)] text-sm mb-6 line-clamp-4 flex-1">
                                        {event.description}
                                    </p>

                                    <div className="space-y-4 pt-6 border-t border-[var(--glass-border)]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-[var(--color-text-muted)]">Registration Fee</span>
                                            <span className="text-2xl font-black text-mindSaga-400">
                                                ₹{event.registrationPrice}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {settings.isRegistrationOpen && (
                                    <button
                                        onClick={() => {
                                            if (event.maxParticipants > 0 && event.approvedParticipants >= event.maxParticipants) return;
                                            navigate('/register');
                                        }}
                                        disabled={event.maxParticipants > 0 && event.approvedParticipants >= event.maxParticipants}
                                        className={`w-full py-4 transition-smooth font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 border-t border-[var(--glass-border)] ${event.maxParticipants > 0 && event.approvedParticipants >= event.maxParticipants
                                            ? 'bg-status-busy/10 text-status-busy cursor-not-allowed'
                                            : 'bg-[var(--color-bg-tertiary)] hover:bg-mindSaga-600 hover:text-white'
                                            }`}
                                    >
                                        {event.maxParticipants > 0 && event.approvedParticipants >= event.maxParticipants
                                            ? 'Registrations Full'
                                            : <>Register for this <MdArrowForward /></>}
                                    </button>
                                )}
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {subEvents.length === 0 && (
                    <div className="text-center py-20 bg-[var(--color-bg-tertiary)] rounded-3xl border border-dashed border-[var(--glass-border)]">
                        <MdEmojiEvents className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4 opacity-20" />
                        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">No Active Sub-Events</h3>
                        <p className="text-[var(--color-text-secondary)]">There are no sub-events available at the moment. Please check back later.</p>
                    </div>
                )}
            </div>

            {/* Footer space to avoid collision with nav if any */}
            <div className="h-20" />
        </div>
    );
};

export default PublicSubEventsPage;
