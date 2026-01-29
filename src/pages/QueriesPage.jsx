import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MessageSquare, Search, Filter, Eye, Trash2,
    CheckCircle, Clock, AlertCircle, X, Save
} from 'lucide-react';
import axios from '../lib/axios';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';

const QueriesPage = () => {
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ pending: 0, inProgress: 0, resolved: 0, total: 0 });
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        fetchQueries();
        fetchStats();
    }, [filter]);

    const fetchQueries = async () => {
        try {
            setLoading(true);
            const statusParam = filter !== 'all' ? `?status=${filter}` : '';
            const response = await axios.get(`/admin/queries${statusParam}`);
            setQueries(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch queries');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get('/admin/queries/stats/summary');
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch stats');
        }
    };

    const handleViewQuery = (query) => {
        setSelectedQuery(query);
        setAdminNotes(query.adminNotes || '');
        setShowModal(true);
    };

    const handleUpdateStatus = async (queryId, newStatus) => {
        try {
            setUpdatingStatus(true);
            await axios.put(`/admin/queries/${queryId}/status`, {
                status: newStatus,
                adminNotes
            });
            toast.success('Query status updated successfully');
            fetchQueries();
            fetchStats();
            setShowModal(false);
        } catch (error) {
            toast.error('Failed to update query status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleDeleteQuery = async (queryId) => {
        if (!window.confirm('Are you sure you want to delete this query?')) return;

        try {
            await axios.delete(`/admin/queries/${queryId}`);
            toast.success('Query deleted successfully');
            fetchQueries();
            fetchStats();
            setShowModal(false);
        } catch (error) {
            toast.error('Failed to delete query');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock, label: 'Pending' },
            in_progress: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: AlertCircle, label: 'In Progress' },
            resolved: { color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle, label: 'Resolved' }
        };
        const badge = badges[status] || badges.pending;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
                <Icon className="w-3 h-3" />
                {badge.label}
            </span>
        );
    };

    const filteredQueries = queries.filter(query => {
        const matchesSearch =
            query.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            query.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            query.mobile.includes(searchTerm) ||
            query.subject.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
                            <MessageSquare className="w-8 h-8 text-mindSaga-500" />
                            User Queries
                        </h1>
                        <p className="text-[var(--color-text-muted)] mt-1">Manage and respond to user queries</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[var(--color-text-muted)]">Pending</p>
                                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                            </div>
                            <Clock className="w-10 h-10 text-yellow-500/30" />
                        </div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[var(--color-text-muted)]">In Progress</p>
                                <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
                            </div>
                            <AlertCircle className="w-10 h-10 text-blue-500/30" />
                        </div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[var(--color-text-muted)]">Resolved</p>
                                <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
                            </div>
                            <CheckCircle className="w-10 h-10 text-green-500/30" />
                        </div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-mindSaga-500/10 to-gd-500/5 border-mindSaga-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[var(--color-text-muted)]">Total</p>
                                <p className="text-3xl font-bold text-mindSaga-600">{stats.total}</p>
                            </div>
                            <MessageSquare className="w-10 h-10 text-mindSaga-500/30" />
                        </div>
                    </Card>
                </div>

                {/* Filters and Search */}
                <Card className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search by name, email, mobile, or subject..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:border-mindSaga-500 focus:ring-1 focus:ring-mindSaga-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            {['all', 'pending', 'in_progress', 'resolved'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === status
                                            ? 'bg-mindSaga-500 text-white'
                                            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                                        }`}
                                >
                                    {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Queries Table */}
                <Card className="overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin w-12 h-12 border-4 border-mindSaga-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-[var(--color-text-muted)] mt-4">Loading queries...</p>
                        </div>
                    ) : filteredQueries.length === 0 ? (
                        <div className="p-12 text-center">
                            <MessageSquare className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                            <p className="text-[var(--color-text-muted)]">No queries found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--glass-border)]">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-[var(--color-text-primary)]">Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-[var(--color-text-primary)]">Contact</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-[var(--color-text-primary)]">Subject</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-[var(--color-text-primary)]">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-[var(--color-text-primary)]">Date</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-[var(--color-text-primary)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredQueries.map((query) => (
                                        <tr key={query._id} className="border-b border-[var(--glass-border)] hover:bg-[var(--color-bg-secondary)] transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-[var(--color-text-primary)]">{query.fullName}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-[var(--color-text-secondary)]">{query.email}</p>
                                                <p className="text-sm text-[var(--color-text-muted)]">{query.mobile}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-[var(--color-text-primary)] max-w-xs truncate">{query.subject}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(query.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-[var(--color-text-muted)]">
                                                    {new Date(query.createdAt).toLocaleDateString()}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleViewQuery(query)}
                                                        className="p-2 rounded-lg bg-mindSaga-500/10 text-mindSaga-600 hover:bg-mindSaga-500/20 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteQuery(query._id)}
                                                        className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>

            {/* Query Detail Modal */}
            {showModal && selectedQuery && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[var(--color-bg-primary)] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[var(--glass-border)]"
                    >
                        <div className="p-6 border-b border-[var(--glass-border)] flex items-center justify-between sticky top-0 bg-[var(--color-bg-primary)] z-10">
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Query Details</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Contact Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-[var(--color-text-muted)]">Full Name</label>
                                    <p className="text-lg font-bold text-[var(--color-text-primary)] mt-1">{selectedQuery.fullName}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-[var(--color-text-muted)]">Status</label>
                                    <div className="mt-1">{getStatusBadge(selectedQuery.status)}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-[var(--color-text-muted)]">Email</label>
                                    <p className="text-[var(--color-text-primary)] mt-1">{selectedQuery.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-[var(--color-text-muted)]">Mobile</label>
                                    <p className="text-[var(--color-text-primary)] mt-1">{selectedQuery.mobile}</p>
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="text-sm font-medium text-[var(--color-text-muted)]">Subject</label>
                                <p className="text-lg font-bold text-[var(--color-text-primary)] mt-1">{selectedQuery.subject}</p>
                            </div>

                            {/* Message */}
                            <div>
                                <label className="text-sm font-medium text-[var(--color-text-muted)]">Message</label>
                                <p className="text-[var(--color-text-primary)] mt-2 p-4 bg-[var(--color-bg-secondary)] rounded-lg whitespace-pre-wrap">
                                    {selectedQuery.message}
                                </p>
                            </div>

                            {/* Admin Notes */}
                            <div>
                                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Admin Notes</label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    rows={4}
                                    placeholder="Add notes about this query..."
                                    className="w-full px-4 py-3 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:border-mindSaga-500 focus:ring-1 focus:ring-mindSaga-500 resize-none"
                                />
                            </div>

                            {/* Status Update */}
                            <div>
                                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Update Status</label>
                                <div className="flex gap-2">
                                    {['pending', 'in_progress', 'resolved'].map((status) => (
                                        <Button
                                            key={status}
                                            onClick={() => handleUpdateStatus(selectedQuery._id, status)}
                                            variant={selectedQuery.status === status ? 'primary' : 'secondary'}
                                            disabled={updatingStatus}
                                            className="flex-1"
                                        >
                                            {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Submitted Date */}
                            <div className="text-sm text-[var(--color-text-muted)] text-center pt-4 border-t border-[var(--glass-border)]">
                                Submitted on {new Date(selectedQuery.createdAt).toLocaleString()}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default QueriesPage;
