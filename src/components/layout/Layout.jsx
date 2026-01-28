import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import useThemeStore from '../../store/themeStore';
import useUIStore from '../../store/uiStore';

const Layout = () => {
    const { theme } = useThemeStore();
    const { sidebarOpen } = useUIStore();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] transition-colors duration-300">
            <Navbar />
            <div className="flex">
                <Sidebar />
                <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'}`}>
                    <div className="p-4 sm:p-6 lg:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
