import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdSearch, MdPeople, MdWarning, MdCheckCircle, MdAccessTime } from 'react-icons/md';
import axios from '../lib/axios';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';

const AvailabilityPage = () => {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchAvailability();
        // Poll every 30 seconds for live updates
        const interval = setInterval(fetchAvailability, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchAvailability = async () => {
        try {
            const response = await axios.get('/admin/participants/availability');
            setParticipants(response.data.data);
        } catch (error) {
            console.error('Error fetching availability:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'available': return <MdCheckCircle className="text-status-available" />;
            case 'busy': return <MdWarning className="text-status-busy" />;
            case 'registered': return <MdAccessTime className="text-debate-400" />;
            default: return <MdPeople className="text-[var(--color-text-muted)]" />;
        }
    };

    const filteredParticipants = participants.filter(p =>
        (p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.prn.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterStatus === 'all' || p.currentStatus === filterStatus)
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                        Live Availability Tracker
                    </h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">
                        Real-time status of all participants across rounds
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchAvailability}>
                        Refresh Now
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">Total</p>
                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">{participants.length}</p>
                </Card>
                <Card className="p-4 flex flex-col items-center justify-center text-center border-l-4 border-status-available">
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">Available</p>
                    <p className="text-2xl font-bold text-status-available">
                        {participants.filter(p => p.currentStatus === 'available').length}
                    </p>
                </Card>
                <Card className="p-4 flex flex-col items-center justify-center text-center border-l-4 border-status-busy">
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">Busy/In Event</p>
                    <p className="text-2xl font-bold text-status-busy">
                        {participants.filter(p => p.currentStatus === 'busy').length}
                    </p>
                </Card>
                <Card className="p-4 flex flex-col items-center justify-center text-center border-l-4 border-debate-400">
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">Waiting</p>
                    <p className="text-2xl font-bold text-debate-400">
                        {participants.filter(p => p.currentStatus === 'registered').length}
                    </p>
                </Card>
            </div>

            {/* Search & Filter Bar */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or PRN..."
                            className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] rounded-lg focus:outline-none focus:ring-2 focus:ring-mindSaga-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] rounded-lg focus:outline-none"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="registered">Waiting</option>
                    </select>
                </div>
            </Card>

            {/* Participants Table/List */}
            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[var(--color-bg-tertiary)] border-b border-[var(--glass-border)]">
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Participant</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">PRN</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Current Event</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Clash Risk</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--glass-border)]">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-0">
                                        <Loader message="Fetching real-time availability..." />
                                    </td>
                                </tr>
                            ) : filteredParticipants.map((p) => (
                                <tr key={p._id} className="hover:bg-white/5 transition-smooth">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-[var(--color-text-primary)]">{p.fullName}</div>
                                        <div className="text-xs text-[var(--color-text-muted)]">{p.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-mindSaga-400">{p.prn}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(p.currentStatus)}
                                            <span className={`capitalize text-sm font-medium ${p.currentStatus === 'available' ? 'text-status-available' : p.currentStatus === 'busy' ? 'text-status-busy' : 'text-debate-400'
                                                }`}>
                                                {p.currentStatus === 'registered' ? 'Waiting' : p.currentStatus}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                                        {p.currentEventName || '--'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {p.registeredSubEvents?.length > 1 ? (
                                            <span className="px-2 py-1 rounded-full bg-status-busy/20 text-status-busy text-[10px] font-bold uppercase">
                                                High Clash Risk ({p.registeredSubEvents.length} Events)
                                            </span>
                                        ) : (
                                            <span className="text-[var(--color-text-muted)] text-xs">Low</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AvailabilityPage;
