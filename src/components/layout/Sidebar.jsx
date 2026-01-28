import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import {
    MdDashboard,
    MdEventNote,
    MdPeople,
    MdSettings,
    MdCalendarToday,
    MdAssessment,
    MdPayment,
    MdCheckCircle,
    MdTopic
} from 'react-icons/md';
import { FiUsers, FiCheckCircle } from 'react-icons/fi';
import { HiOutlineClipboardList } from 'react-icons/hi';
import useUIStore from '../../store/uiStore';

const Sidebar = () => {
    const { sidebarOpen, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();

    // Close mobile sidebar on route change
    const handleLinkClick = () => {
        if (window.innerWidth < 1024) {
            setMobileSidebarOpen(false);
        }
    };

    // Close mobile sidebar on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (mobileSidebarOpen && !e.target.closest('.sidebar') && !e.target.closest('button[aria-label="Toggle mobile menu"]')) {
                setMobileSidebarOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [mobileSidebarOpen, setMobileSidebarOpen]);

    const menuItems = [
        { name: 'Dashboard', icon: MdDashboard, path: '/admin/dashboard' },
        { name: 'Sub-Events', icon: MdEventNote, path: '/admin/subevents' },
        { name: 'Participants', icon: FiUsers, path: '/admin/participants' },
        { name: 'Registrations', icon: HiOutlineClipboardList, path: '/admin/registrations' },
        { name: 'Availability', icon: MdCalendarToday, path: '/admin/availability' },
        { name: 'Analytics', icon: MdAssessment, path: '/admin/analytics' },
        { name: 'Topics', icon: MdTopic, path: '/admin/topics' },
        { name: 'Attendance', icon: MdCheckCircle, path: '/admin/attendance' },
        { name: 'Payment Settings', icon: MdPayment, path: '/admin/payment-settings' },
        { name: 'Settings', icon: MdSettings, path: '/admin/settings' },
    ];

    const sidebarVariants = {
        open: { width: '16rem' },
        closed: { width: '5rem' }
    };

    const mobileSidebarVariants = {
        open: { x: 0 },
        closed: { x: '-100%' }
    };

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {mobileSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <motion.aside
                variants={sidebarVariants}
                animate={sidebarOpen ? 'open' : 'closed'}
                transition={{ duration: 0.3 }}
                className="hidden lg:block glass-strong border-r border-[var(--glass-border)] h-[calc(100vh-4rem)] sticky top-16 overflow-hidden"
            >
                <nav className="p-4 space-y-2">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth ${isActive
                                    ? 'bg-mindSaga-600 text-white'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <AnimatePresence>
                                {sidebarOpen && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        transition={{ duration: 0.2, delay: 0.1 }}
                                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                                    >
                                        {item.name}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </NavLink>
                    ))}
                </nav>
            </motion.aside>

            {/* Mobile Sidebar */}
            <motion.aside
                variants={mobileSidebarVariants}
                initial="closed"
                animate={mobileSidebarOpen ? 'open' : 'closed'}
                className="sidebar fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] glass-strong border-r border-[var(--glass-border)] z-50 lg:hidden"
            >
                <nav className="p-4 space-y-2">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={handleLinkClick}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth ${isActive
                                    ? 'bg-mindSaga-600 text-white'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm font-medium">{item.name}</span>
                        </NavLink>
                    ))}
                </nav>
            </motion.aside>
        </>
    );
};

export default Sidebar;
