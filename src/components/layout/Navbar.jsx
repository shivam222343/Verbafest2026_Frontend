import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenu, HiX } from 'react-icons/hi';
import { MdLightMode, MdDarkMode, MdLogout, MdPerson, MdEmail } from 'react-icons/md';
import { FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import useThemeStore from '../../store/themeStore';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';

const Navbar = () => {
    const { theme, toggleTheme } = useThemeStore();
    const { sidebarOpen, toggleSidebar, mobileSidebarOpen, toggleMobileSidebar } = useUIStore();
    const { user, logout } = useAuthStore();
    const [profileOpen, setProfileOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="glass-strong border-b border-[var(--glass-border)] sticky top-0 z-50">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left Section - Menu Toggle + Logo */}
                    <div className="flex items-center gap-4">
                        {/* Desktop Sidebar Toggle */}
                        <button
                            onClick={toggleSidebar}
                            className="hidden lg:flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-smooth"
                            aria-label="Toggle sidebar"
                        >
                            {sidebarOpen ? (
                                <HiX className="w-5 h-5 text-[var(--color-text-primary)]" />
                            ) : (
                                <HiMenu className="w-5 h-5 text-[var(--color-text-primary)]" />
                            )}
                        </button>

                        {/* Mobile Sidebar Toggle */}
                        <button
                            onClick={toggleMobileSidebar}
                            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-smooth"
                            aria-label="Toggle mobile menu"
                        >
                            {mobileSidebarOpen ? (
                                <HiX className="w-5 h-5 text-[var(--color-text-primary)]" />
                            ) : (
                                <HiMenu className="w-5 h-5 text-[var(--color-text-primary)]" />
                            )}
                        </button>

                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg border border-[var(--glass-border)] bg-white p-1">
                                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                    Event Orchestration
                                </h1>
                                <p className="text-xs text-[var(--color-text-muted)]">Admin Dashboard</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleTheme}
                            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-smooth"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <MdLightMode className="w-5 h-5 text-[var(--color-text-primary)]" />
                            ) : (
                                <MdDarkMode className="w-5 h-5 text-[var(--color-text-primary)]" />
                            )}
                        </motion.button>

                        {/* User Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-smooth ${profileOpen ? 'bg-[var(--color-bg-tertiary)]' : ''}`}
                            >
                                <div className="w-8 h-8 rounded-full bg-mindSaga-600 flex items-center justify-center shadow-inner">
                                    <FiUser className="w-4 h-4 text-white" />
                                </div>
                                <span className="hidden md:block text-sm font-medium text-[var(--color-text-primary)]">
                                    {user?.name || 'Admin'}
                                </span>
                            </button>

                            <AnimatePresence>
                                {profileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-2 w-72 glass-strong border border-[var(--glass-border)] rounded-2xl shadow-2xl p-4 z-50 overflow-hidden"
                                    >
                                        {/* Dropdown Header */}
                                        <div className="flex items-center gap-4 pb-4 mb-4 border-b border-[var(--glass-border)]">
                                            <div className="w-12 h-12 rounded-full bg-mindSaga-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                                {user?.name?.charAt(0) || <FiUser />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">
                                                    {user?.name || 'Admin'}
                                                </p>
                                                <p className="text-xs text-[var(--color-text-muted)] truncate">
                                                    {user?.email || 'admin@event.com'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Dropdown Content */}
                                        <div className="space-y-1">
                                            <div className="px-3 py-2 rounded-xl bg-mindSaga-500/5 border border-mindSaga-500/10 mb-4">
                                                <p className="text-[10px] text-mindSaga-400 font-bold uppercase tracking-wider mb-2">Account Info</p>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                                                        <MdPerson className="w-4 h-4" />
                                                        <span>Role: <span className="text-mindSaga-500 font-bold uppercase">{user?.role || 'Admin'}</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                                                        <MdEmail className="w-4 h-4" />
                                                        <span className="truncate">{user?.email || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-status-busy hover:bg-status-busy/10 transition-smooth font-bold"
                                            >
                                                <MdLogout className="w-5 h-5" />
                                                <span>Logout</span>
                                            </button>
                                        </div>

                                        {/* Decorative gradient corner */}
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-mindSaga-500/10 rounded-full blur-2xl -z-10 -translate-y-1/2 translate-x-1/2" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

