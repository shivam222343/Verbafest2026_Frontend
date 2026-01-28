import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdLogin, MdVpnKey } from 'react-icons/md';
import axios from '../../lib/axios';
import toast from 'react-hot-toast';
import useThemeStore from '../../store/themeStore';
import ThemeToggle from '../../components/ThemeToggle';

const JudgeLogin = () => {
    const [accessCode, setAccessCode] = useState('');
    const [loading, setLoading] = useState(false);
    const { theme } = useThemeStore();
    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!accessCode || accessCode.length < 6) {
            toast.error('Please enter a valid access code');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post('/judge/login', {
                accessCode: accessCode.toUpperCase()
            });

            if (response.data.success) {
                // Store judge session data
                localStorage.setItem('judgeSession', JSON.stringify({
                    accessCode: response.data.data.accessCode,
                    judgeName: response.data.data.judgeName,
                    judgeEmail: response.data.data.judgeEmail,
                    panelId: response.data.data.panelId,
                    panelName: response.data.data.panelName
                }));

                toast.success(`Welcome, ${response.data.data.judgeName}!`);
                navigate('/judge/dashboard');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid access code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] transition-colors duration-300 flex items-center justify-center p-4">
            {/* Theme Toggle Positioned Top Right */}
            <div className="absolute top-6 right-6 z-50">
                <ThemeToggle />
            </div>
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-20 left-20 w-72 h-72 bg-mindSaga-500/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute bottom-20 right-20 w-96 h-96 bg-debate-500/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.5, 0.3, 0.5]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white border border-[var(--glass-border)] shadow-2xl p-2 mb-4 overflow-hidden"
                    >
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </motion.div>
                    <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-2 font-display">
                        Judge Portal
                    </h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Enter your access code to begin evaluation
                    </p>
                </div>

                {/* Login Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[var(--glass-bg)] backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-[var(--glass-border)]"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Access Code Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                                Access Code
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                    placeholder="Enter 8-character code"
                                    maxLength={10}
                                    className="w-full px-4 py-4 bg-[var(--input-bg)] border-2 border-[var(--input-border)] rounded-xl text-[var(--color-text-primary)] text-center text-2xl font-mono tracking-widest uppercase focus:outline-none focus:border-mindSaga-500 transition-all placeholder:text-[var(--color-text-muted)]"
                                    autoFocus
                                />
                                <motion.div
                                    className="absolute inset-0 rounded-xl pointer-events-none"
                                    animate={{
                                        boxShadow: accessCode.length >= 6
                                            ? '0 0 20px rgba(139, 92, 246, 0.3)'
                                            : '0 0 0px rgba(139, 92, 246, 0)'
                                    }}
                                />
                            </div>
                            <p className="text-xs text-[var(--color-text-muted)] text-center">
                                Code is case-insensitive
                            </p>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={loading || accessCode.length < 6}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full py-4 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2 transition-all ${loading || accessCode.length < 6
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-mindSaga-600 to-debate-600 hover:shadow-lg hover:shadow-mindSaga-500/50'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <MdLogin className="w-6 h-6" />
                                    Access Panel
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Info Section */}
                    <div className="mt-8 pt-6 border-t border-[var(--glass-border)]">
                        <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
                            <div className="flex items-start gap-2">
                                <span className="text-mindSaga-400 mt-0.5">•</span>
                                <p>Your access code was provided by the event administrator</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-mindSaga-400 mt-0.5">•</span>
                                <p>Each judge has a unique code for their assigned panel</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-mindSaga-400 mt-0.5">•</span>
                                <p>Contact the administrator if you haven't received your code</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Footer */}
                <p className="text-center text-[var(--color-text-muted)] text-sm mt-6">
                    Event Management System © 2026
                </p>
            </motion.div>
        </div>
    );
};

export default JudgeLogin;
