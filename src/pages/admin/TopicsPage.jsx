import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdAdd, MdDelete, MdEdit, MdSearch, MdFilterList,
    MdTopic, MdCheckCircle, MdBlock, MdInfo, MdRefresh
} from 'react-icons/md';
import axios from '../../lib/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import Loader from '../../components/ui/Loader';
import { useAdminSocket } from '../../hooks/useSocket';

const TopicsPage = () => {
    const [topics, setTopics] = useState([]);
    const [subEvents, setSubEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubEvent, setSelectedSubEvent] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newTopics, setNewTopics] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [selectedTopicIds, setSelectedTopicIds] = useState([]);

    // Socket listeners for real-time updates
    useAdminSocket({
        onTopicUsedBulk: ({ topicIds }) => {
            setTopics(prev => prev.map(t =>
                topicIds.includes(t._id) ? { ...t, isUsed: true, usedAt: new Date() } : t
            ));
        },
        onTopicClaimed: ({ topic }) => {
            setTopics(prev => prev.map(t =>
                t._id === topic._id ? { ...t, ...topic, isUsed: true } : t
            ));
        },
        onTopicReset: ({ topicId }) => {
            setTopics(prev => prev.map(t =>
                t._id === topicId ? { ...t, isUsed: false, usedByGroup: null, usedByPanel: null, usedAt: null } : t
            ));
        }
    });

    useEffect(() => {
        fetchSubEvents();
        fetchTopics();
    }, []);

    const fetchSubEvents = async () => {
        try {
            const response = await axios.get('/admin/subevents');
            setSubEvents(response.data.data);
            if (response.data.data.length > 0) {
                // setSelectedSubEvent(response.data.data[0]._id);
            }
        } catch (error) {
            toast.error('Failed to fetch sub-events');
        }
    };

    const fetchTopics = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/admin/topics', {
                params: { subEventId: selectedSubEvent }
            });
            setTopics(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch topics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTopics();
    }, [selectedSubEvent]);

    const handleAddTopics = async () => {
        if (!selectedSubEvent) {
            toast.error('Please select a sub-event first');
            return;
        }

        const topicList = newTopics.split('\n').filter(t => t.trim().length > 0);
        if (topicList.length === 0) {
            toast.error('Please enter at least one topic');
            return;
        }

        try {
            await axios.post('/admin/topics', {
                subEventId: selectedSubEvent,
                topics: topicList
            });
            toast.success(`Successfully added ${topicList.length} topics`);
            setNewTopics('');
            setIsAddModalOpen(false);
            fetchTopics();
        } catch (error) {
            toast.error('Failed to add topics');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this topic?')) return;
        try {
            await axios.delete(`/admin/topics/${id}`);
            toast.success('Topic deleted');
            fetchTopics();
        } catch (error) {
            toast.error('Failed to delete topic');
        }
    };

    const handleResetTopic = async (id) => {
        if (!window.confirm('Make this topic available for selection again?')) return;
        try {
            await axios.post(`/admin/topics/${id}/reset`);
            toast.success('Topic is now available');
            // State will be updated by socket or we can do it manually
            setTopics(prev => prev.map(t =>
                t._id === id ? { ...t, isUsed: false, usedByGroup: null, usedByPanel: null, usedAt: null } : t
            ));
        } catch (error) {
            toast.error('Failed to reset topic');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedTopicIds.length === 0) return;
        if (!window.confirm(`Delete ${selectedTopicIds.length} topics?`)) return;

        try {
            setIsBulkDeleting(true);
            await axios.post('/admin/topics/bulk-delete', { topicIds: selectedTopicIds });
            toast.success('Topics deleted');
            setSelectedTopicIds([]);
            fetchTopics();
        } catch (error) {
            toast.error('Failed to delete topics');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const toggleTopicSelection = (id) => {
        setSelectedTopicIds(prev =>
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
    };

    const filteredTopics = topics.filter(t =>
        t.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Topics Management</h1>
                    <p className="text-[var(--color-text-secondary)] text-sm">Add and manage topics/prompts for sub-events (GD, Debate, etc.)</p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedTopicIds.length > 0 && (
                        <Button
                            variant="danger"
                            className="flex items-center gap-2"
                            onClick={handleBulkDelete}
                            loading={isBulkDeleting}
                        >
                            <MdDelete className="w-4 h-4" />
                            Delete ({selectedTopicIds.length})
                        </Button>
                    )}
                    <Button
                        variant="primary"
                        className="flex items-center gap-2"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        <MdAdd className="w-5 h-5" />
                        Add Topics
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative">
                        <MdFilterList className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <select
                            value={selectedSubEvent}
                            onChange={(e) => setSelectedSubEvent(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:ring-2 focus:ring-mindSaga-500 outline-none appearance-none"
                        >
                            <option value="">All Sub-Events</option>
                            {subEvents.map(event => (
                                <option key={event._id} value={event._id}>{event.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <Input
                            placeholder="Search topics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </Card>

            {/* Topics List */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader size="lg" /></div>
            ) : filteredTopics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredTopics.map((topic) => (
                            <motion.div
                                key={topic._id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <Card
                                    className={`p-5 relative group transition-all duration-300 border-l-4 ${topic.isUsed
                                        ? (topic.usedByGroup ? 'border-l-status-busy bg-status-busy/5' : 'border-l-status-available bg-status-available/5')
                                        : 'border-l-mindSaga-500 hover:shadow-lg'
                                        } ${selectedTopicIds.includes(topic._id) ? 'ring-2 ring-mindSaga-500' : ''}`}
                                >
                                    <div className="absolute top-4 right-4 flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedTopicIds.includes(topic._id)}
                                            onChange={() => toggleTopicSelection(topic._id)}
                                            className="w-4 h-4 rounded border-gray-300 text-mindSaga-600 focus:ring-mindSaga-500"
                                        />
                                        <button
                                            onClick={() => handleDelete(topic._id)}
                                            className="p-1.5 rounded-lg text-status-busy hover:bg-status-busy/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete Topic"
                                        >
                                            <MdDelete className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-mindSaga-500/10 text-mindSaga-400 font-bold uppercase tracking-wider">
                                                    {topic.subEventId?.name || 'Sub-Event'}
                                                </span>
                                                {topic.isUsed && !topic.usedByGroup && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-available/10 text-status-available font-bold uppercase tracking-wider flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-status-available animate-pulse" /> In Selection
                                                    </span>
                                                )}
                                                {topic.isUsed && topic.usedByGroup && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-busy/10 text-status-busy font-bold uppercase tracking-wider flex items-center gap-1">
                                                        <MdBlock className="w-3 h-3" /> Assigned
                                                    </span>
                                                )}
                                            </div>

                                            {/* Reset Button for Admins */}
                                            {topic.isUsed && (
                                                <button
                                                    onClick={() => handleResetTopic(topic._id)}
                                                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-mindSaga-500 hover:text-mindSaga-600 transition-colors"
                                                    title="Make this topic available again"
                                                >
                                                    <MdRefresh className="w-3 h-3" /> <span className='mr-14'>Reset</span>
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-[var(--color-text-primary)] font-medium line-clamp-3">
                                            {topic.content}
                                        </p>
                                    </div>

                                    {topic.isUsed && topic.usedByGroup && (
                                        <div className="mt-3 pt-3 border-t border-[var(--glass-border)] text-xs text-[var(--color-text-muted)] space-y-1">
                                            <p className="flex items-center gap-1">
                                                <MdCheckCircle className="w-3.5 h-3.5 text-status-available" />
                                                Used by: <span className="text-[var(--color-text-primary)] font-semibold">{topic.usedByGroup?.groupName || 'Unknown Group'}</span>
                                            </p>
                                            <p>At: {new Date(topic.usedAt).toLocaleString()}</p>
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <MdTopic className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4 opacity-20" />
                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">No Topics Found</h3>
                    <p className="text-[var(--color-text-secondary)] max-w-md mx-auto">
                        Add topics to your sub-events to provide prompts for judges and participants in GD or Debate rounds.
                    </p>
                    <Button
                        variant="primary"
                        className="mt-6"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        Add Your First Topic
                    </Button>
                </Card>
            )}

            {/* Add Topics Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsAddModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-xl relative z-10"
                        >
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Add New Topics</h2>
                                    <button onClick={() => setIsAddModalOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                                        <MdBlock className="w-6 h-6 rotate-45" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">
                                            Target Sub-Event
                                        </label>
                                        <select
                                            value={selectedSubEvent}
                                            onChange={(e) => setSelectedSubEvent(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:ring-2 focus:ring-mindSaga-500 outline-none"
                                        >
                                            <option value="">Select a Sub-Event</option>
                                            {subEvents.map(event => (
                                                <option key={event._id} value={event._id}>{event.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">
                                            Topics (One per line)
                                        </label>
                                        <textarea
                                            value={newTopics}
                                            onChange={(e) => setNewTopics(e.target.value)}
                                            className="w-full h-48 px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:ring-2 focus:ring-mindSaga-500 outline-none resize-none font-medium"
                                            placeholder="Example: Is AI better than Humans?&#10;Social Media: Curse or Blessing?&#10;The impact of climate change..."
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                        <MdInfo className="w-5 h-5 text-blue-400 shrink-0" />
                                        <p className="text-xs text-blue-500 leading-relaxed">
                                            Enter multiple topics by separating them with new lines. We'll automatically create a separate record for each line.
                                        </p>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            variant="secondary"
                                            className="flex-1"
                                            onClick={() => setIsAddModalOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="primary"
                                            className="flex-1"
                                            onClick={handleAddTopics}
                                            disabled={!selectedSubEvent || !newTopics.trim()}
                                        >
                                            Add Topics
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TopicsPage;
