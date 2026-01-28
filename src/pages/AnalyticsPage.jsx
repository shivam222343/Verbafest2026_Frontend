import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { MdTrendingUp, MdPeople, MdEvent, MdTimeline } from 'react-icons/md';
import axios from '../lib/axios';
import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AnalyticsPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/admin/analytics');
            setData(response.data.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !data) {
        return <Loader message="Compiling event analytics..." />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                    Analytics Dashboard
                </h1>
                <p className="text-[var(--color-text-secondary)] mt-1">
                    Comprehensive statistics and event performance metrics
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="p-6 border-l-4 border-mindSaga-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-mindSaga-500/10 text-mindSaga-500">
                            <MdPeople className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--color-text-muted)]">Total Participants</p>
                            <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">{data.totalParticipants}</h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-status-available">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-status-available/10 text-status-available">
                            <MdTrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--color-text-muted)]">Approved</p>
                            <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">{data.approvedParticipants}</h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-gd-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gd-500/10 text-gd-500">
                            <MdEvent className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--color-text-muted)]">Sub-Events</p>
                            <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">{data.totalSubEvents}</h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-debate-400">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-debate-400/10 text-debate-400">
                            <MdTimeline className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--color-text-muted)]">Active Rounds</p>
                            <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">{data.activeRounds}</h3>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Registration Trends */}
                <Card className="p-6">
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Registration Trends</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.trendData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                                <XAxis
                                    dataKey="date"
                                    stroke="var(--color-text-muted)"
                                    fontSize={12}
                                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                                />
                                <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        color: 'var(--color-text-primary)'
                                    }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Status Distribution */}
                <Card className="p-6">
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Live Status Distribution</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Sub-Event Popularity */}
                <Card className="p-6 lg:col-span-2">
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Sub-Event Popularity</h2>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.subEventPop} margin={{ bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--color-text-muted)"
                                    fontSize={10}
                                    angle={-20}
                                    textAnchor="end"
                                    interval={0}
                                />
                                <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="registrations" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AnalyticsPage;
