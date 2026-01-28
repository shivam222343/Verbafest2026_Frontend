import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdRefresh, MdClose, MdAutoFixHigh, MdCheckCircle, MdTimer } from 'react-icons/md';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import Button from './ui/Button';

// Particle component for celebration
const Particle = ({ color }) => {
    const randomX = Math.random() * 600 - 300;
    const randomY = Math.random() * -500 - 150;
    const duration = 1.5 + Math.random();

    return (
        <motion.div
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{
                x: randomX,
                y: randomY,
                scale: 0,
                opacity: 0,
                rotate: 720
            }}
            transition={{ duration, ease: "easeOut" }}
            className="absolute w-3 h-3 rounded-md"
            style={{ backgroundColor: color }}
        />
    );
};

const TopicSpinner = ({ accessCode, groupId, subEventId, onTopicClaimed, onClose }) => {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [spinning, setSpinning] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [alreadyClaimed, setAlreadyClaimed] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [showCelebration, setShowCelebration] = useState(false);

    useEffect(() => {
        fetchAvailableTopics();
    }, []);

    const fetchAvailableTopics = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/judge/available-topics/${accessCode}/${groupId}`);
            if (response.data.isAlreadySelected) {
                setAlreadyClaimed(true);
                setSelectedTopic(response.data.data[0]);
            } else {
                setTopics(response.data.data);
                // Fallback for safety - if topics empty but reported as success, try re-fetching or alert
                if (response.data.data.length === 0) {
                    console.warn('Backend returned empty topics pool');
                }
            }
        } catch (error) {
            console.error('Fetch topics error:', error);
            toast.error('Could not load topics pool');
        } finally {
            setLoading(false);
        }
    };

    const handleSpin = async () => {
        if (topics.length === 0 || spinning) return;

        setSpinning(true);
        // Randomly choose a winner from the pool (usually 4 items)
        const winnerIndex = Math.floor(Math.random() * topics.length);
        const winner = topics[winnerIndex];

        // Slot machine effect: Faster cycles
        const spinCycles = 4;
        const totalSteps = (spinCycles * topics.length) + winnerIndex;
        let currentStep = 0;

        const interval = setInterval(() => {
            setActiveIndex(currentStep % topics.length);
            currentStep++;

            if (currentStep > totalSteps) {
                clearInterval(interval);
                finalizeSelection(winner);
            }
        }, 100);
    };

    const finalizeSelection = async (winner) => {
        try {
            const response = await axios.post('/judge/claim-topic', {
                accessCode,
                groupId,
                topicId: winner._id
            });

            setSelectedTopic(response.data.data);
            setAlreadyClaimed(true);
            onTopicClaimed(response.data.data);
            setShowCelebration(true);

            // Celebration lasts for 4 seconds
            setTimeout(() => setShowCelebration(false), 4000);

            toast.success('Topic Finalized!', { icon: '🎯' });
        } catch (error) {
            toast.error('Selection synchronization failed. Refreshing pool.');
            fetchAvailableTopics();
        } finally {
            setSpinning(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-10 rounded-3xl bg-[var(--color-bg-secondary)] shadow-2xl flex flex-col items-center"
                >
                    <div className="w-12 h-12 border-4 border-mindSaga-500/20 border-t-mindSaga-500 rounded-full animate-spin mb-4" />
                    <p className="text-[var(--color-text-primary)] font-bold text-sm">Preparing Topic Pool...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={!spinning ? onClose : undefined}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-3xl relative z-10"
            >
                <div className="p-1 rounded-[32px] bg-gradient-to-br from-mindSaga-500/30 via-white/10 to-transparent border border-white/20 shadow-2xl overflow-hidden glass-strong">
                    <div className="relative p-6 md:p-10 rounded-[31px] bg-[var(--color-bg-secondary)]">

                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-mindSaga-500/10 text-mindSaga-500">
                                    <MdAutoFixHigh className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-bold font-heading text-[var(--color-text-primary)]">Select Topic</h2>
                            </div>
                            {!spinning && (
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] transition-all hover:text-[var(--color-text-primary)]"
                                >
                                    <MdClose className="w-6 h-6" />
                                </button>
                            )}
                        </div>

                        {alreadyClaimed ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-6 relative"
                            >
                                {showCelebration && (
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-full h-full overflow-visible z-50">
                                        {[...Array(60)].map((_, i) => (
                                            <Particle key={i} color={['#a855f7', '#3b82f6', '#f97316', '#10b981', '#fbbf24'][i % 5]} />
                                        ))}
                                    </div>
                                )}

                                <div className="max-w-xl mx-auto px-8 py-12 rounded-3xl bg-mindSaga-500/5 border-2 border-mindSaga-500/20 shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-mindSaga-500 to-transparent opacity-50" />

                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-status-available/10 text-status-available text-[10px] font-black uppercase tracking-widest mb-6 border border-status-available/20">
                                        <MdCheckCircle className="w-4 h-4" /> Final Selection
                                    </div>
                                    <p className="text-2xl md:text-3xl font-black text-[var(--color-text-primary)] leading-snug italic">
                                        "{selectedTopic?.content}"
                                    </p>
                                </div>

                                <Button
                                    variant="primary"
                                    onClick={onClose}
                                    className="mt-10 min-w-[200px] h-14 rounded-2xl bg-gradient-to-r from-mindSaga-600 to-mindSaga-800 shadow-mindSaga-500/20 shadow-xl text-lg font-black tracking-wide"
                                >
                                    Proceed With Scoring
                                </Button>
                            </motion.div>
                        ) : (
                            <div className="space-y-8">
                                {/* Pool Grid */}
                                {topics.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {topics.map((topic, idx) => (
                                            <motion.div
                                                key={topic._id}
                                                animate={{
                                                    opacity: spinning ? (activeIndex === idx ? 1 : 0.3) : 1,
                                                    scale: spinning && activeIndex === idx ? 1.04 : 1,
                                                    borderColor: activeIndex === idx && spinning ? 'var(--color-mindSaga)' : 'var(--glass-border)',
                                                }}
                                                className={`
                                                    relative p-6 rounded-2xl border-2 transition-all duration-150
                                                    ${activeIndex === idx && spinning
                                                        ? 'bg-mindSaga-500/10 shadow-[0_0_25px_rgba(168,85,247,0.25)] border-mindSaga-500'
                                                        : 'bg-[var(--color-bg-tertiary)] border-[var(--input-border)]'}
                                                `}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`
                                                        w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0
                                                        ${activeIndex === idx && spinning ? 'bg-mindSaga-500 text-white shadow-lg' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] border border-[var(--glass-border)]'}
                                                    `}>
                                                        {idx + 1}
                                                    </div>
                                                    <p className={`
                                                        font-bold leading-relaxed text-sm
                                                        ${activeIndex === idx && spinning ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}
                                                    `}>
                                                        {topic.content}
                                                    </p>
                                                </div>

                                                {activeIndex === idx && spinning && (
                                                    <motion.div
                                                        layoutId="spinner-glow"
                                                        className="absolute inset-0 rounded-2xl ring-2 ring-mindSaga-500 pointer-events-none"
                                                    />
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-500/5 rounded-2xl border-2 border-dashed border-gray-500/10">
                                        <MdTimer className="w-12 h-12 text-gray-400 mb-4 animate-pulse" />
                                        <p className="text-[var(--color-text-muted)] font-medium">Wait... No topics available in pool.</p>
                                        <button onClick={fetchAvailableTopics} className="mt-4 text-mindSaga-500 font-bold hover:underline">Retry Fetching</button>
                                    </div>
                                )}

                                <div className="flex flex-col items-center pt-6 border-t border-[var(--glass-border)]">
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="w-full max-w-md"
                                    >
                                        <Button
                                            variant="primary"
                                            className="w-full h-16 rounded-2xl bg-gradient-to-r from-mindSaga-600 to-mindSaga-800 shadow-mindSaga-500/30 shadow-2xl text-xl font-black tracking-widest flex items-center justify-center gap-4 transition-all uppercase"
                                            onClick={handleSpin}
                                            disabled={spinning || topics.length === 0}
                                        >
                                            {spinning ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <span>SHUFFLING...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <MdRefresh className="w-7 h-7 animate-spin-slow" />
                                                    <span>SPIN TOPIC</span>
                                                </>
                                            )}
                                        </Button>
                                    </motion.div>
                                    <p className="mt-4 text-[10px] text-[var(--color-text-muted)] font-black uppercase tracking-[0.2em] opacity-40">Randomization Algorithm Active</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TopicSpinner;
