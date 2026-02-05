import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import useThemeStore from "../store/themeStore";
import ThemeToggle from "../components/ThemeToggle";
import RegistrationForm from "../components/registration/RegistrationForm";
import QueryForm from "../components/QueryForm";

const RegistrationPage = () => {
    const { theme, setTheme } = useThemeStore();

    useEffect(() => {
        // Set default to light when entering registration page
        setTheme('light');
    }, [setTheme]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] gradient-overlay transition-colors duration-300">
            {/* Header */}
            <header className="glass-strong border-b border-[var(--glass-border)]">
                <div className="container mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg border border-[var(--glass-border)] bg-white p-1">
                                <img src="/Mavericks_Logo.png" alt="Mavericks Logo" className="w-full h-full object-contain" />
                            </div>
                            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg border border-[var(--glass-border)] bg-white p-1">
                                <img src="/logo.png" alt="Verbafest Logo" className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <a
                                href="/participant/login"
                                className="px-4 py-2 rounded-lg bg-gd-600 text-white font-medium hover:bg-gd-500 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span className="hidden sm:inline">Go to Participant Dashboard</span>
                                <span className="sm:hidden">Dashboard</span>
                            </a>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-12 space-y-16">
                <RegistrationForm />

                {/* Query Section */}
                <div className="max-w-4xl mx-auto">
                    <QueryForm />
                </div>
            </main>

            {/* Footer */}
            <footer className="glass-strong border-t border-[var(--glass-border)] mt-12">
                <div className="container mx-auto px-6 py-6 text-center text-[var(--color-text-muted)]">
                    <p>Event Orchestration Platform - Registration Portal</p>
                </div>
            </footer>
        </div>
    );
};

export default RegistrationPage;
