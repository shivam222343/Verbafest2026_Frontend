import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    MdArrowBack, MdPerson, MdEmail, MdPhone, MdSchool,
    MdAssignment, MdEmojiEvents, MdCancel, MdCheckCircle,
    MdEvent, MdBadge
} from 'react-icons/md';
import axios from '../../lib/axios';
import Loader from '../../components/ui/Loader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const ParticipantProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [participant, setParticipant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [eventHistory, setEventHistory] = useState([]);

    useEffect(() => {
        fetchParticipantDetails();
    }, [id]);

    const fetchParticipantDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/admin/participants/${id}`);
            setParticipant(response.data.data);

            // Fetch rounds history for this participant
            const roundsRes = await axios.get(`/admin/participants/${id}/history`);
            setEventHistory(roundsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch participant details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader message="Accessing participant records..." />;
    if (!participant) return <div className="text-center p-20 text-gray-400">Participant not found</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] transition-smooth"
                >
                    <MdArrowBack className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Participant Profile</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <Card className="lg:col-span-1 p-6 flex flex-col items-center text-center">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-mindSaga-600 to-debate-600 flex items-center justify-center text-white text-5xl font-bold mb-4 shadow-xl">
                        {participant.fullName.charAt(0)}
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">{participant.fullName}</h2>
                    <p className="text-mindSaga-400 font-mono mb-4">{participant.prn}</p>

                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 ${participant.registrationStatus === 'approved' ? 'bg-status-available/20 text-status-available' :
                            participant.registrationStatus === 'pending' ? 'bg-debate-500/20 text-debate-400' :
                                'bg-status-busy/20 text-status-busy'
                        }`}>
                        {participant.registrationStatus}
                    </div>

                    <div className="w-full space-y-4 text-left pt-6 border-t border-[var(--glass-border)]">
                        <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                            <MdEmail className="text-mindSaga-400 w-5 h-5 shrink-0" />
                            <span className="truncate">{participant.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                            <MdPhone className="text-mindSaga-400 w-5 h-5 shrink-0" />
                            <span>{participant.mobile}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                            <MdSchool className="text-mindSaga-400 w-5 h-5 shrink-0" />
                            <span>Year {participant.year}, {participant.branch}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                            <MdBadge className="text-mindSaga-400 w-5 h-5 shrink-0" />
                            <span>{participant.college}</span>
                        </div>
                    </div>
                </Card>

                {/* Event Participation & History */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Registered Events */}
                    <Card className="p-6">
                        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                            <MdAssignment className="text-mindSaga-400" /> Registered Sub-Events
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {participant.registeredSubEvents?.map(event => (
                                <div key={event._id} className="p-4 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--glass-border)] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg bg-${event.accentColor || 'mindSaga'}-600/20 flex items-center justify-center`}>
                                            <MdEmojiEvents className={`text-${event.accentColor || 'mindSaga'}-400 w-6 h-6`} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[var(--color-text-primary)]">{event.name}</p>
                                            <p className="text-xs text-[var(--color-text-muted)] capitalize">{event.type}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${(participant.statusPerSubEvent?.[event._id]?.status || 'registered') === 'winner' ? 'bg-status-available/20 text-status-available' :
                                            (participant.statusPerSubEvent?.[event._id]?.status || 'registered') === 'eliminated' ? 'bg-status-busy/20 text-status-busy' :
                                                'bg-mindSaga-500/20 text-mindSaga-400'
                                        }`}>
                                        {participant.statusPerSubEvent?.[event._id]?.status || 'registered'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Round-by-Round Breakdown */}
                    <Card className="p-6">
                        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                            <MdEvent className="text-mindSaga-400" /> Performance History
                        </h3>

                        {eventHistory.length === 0 ? (
                            <div className="p-10 text-center text-[var(--color-text-muted)] italic bg-[var(--color-bg-tertiary)] rounded-xl border border-dashed border-[var(--glass-border)]">
                                No active participation records found.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {eventHistory.map((history, idx) => (
                                    <div key={idx} className="relative pl-8 pb-4 border-l-2 border-[var(--glass-border)] last:border-0 last:pb-0">
                                        <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 border-[var(--color-bg-primary)] ${history.status === 'qualified' ? 'bg-status-available' :
                                                history.status === 'eliminated' ? 'bg-status-busy' : 'bg-mindSaga-500'
                                            }`} />
                                        <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-xl border border-[var(--glass-border)]">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="text-xs font-bold text-mindSaga-400 uppercase">{history.subEventName}</p>
                                                    <h4 className="font-bold text-[var(--color-text-primary)]">{history.roundName} (Round {history.roundNumber})</h4>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${history.status === 'qualified' ? 'bg-status-available/20 text-status-available' :
                                                        history.status === 'eliminated' ? 'bg-status-busy/20 text-status-busy' :
                                                            'bg-debate-500/20 text-debate-400'
                                                    }`}>
                                                    {history.status}
                                                </span>
                                            </div>
                                            {history.groupName && (
                                                <p className="text-sm text-[var(--color-text-secondary)]">
                                                    Group: <span className="text-[var(--color-text-primary)] font-medium">{history.groupName}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ParticipantProfile;
