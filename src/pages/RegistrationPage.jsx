import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import useThemeStore from "../store/themeStore";
import ThemeToggle from "../components/ThemeToggle";
import RegistrationForm from "../components/registration/RegistrationForm";

const RegistrationPage = () => {
    const { theme } = useThemeStore();

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
                                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <h1 className="text-2xl font-bold text-gradient">
                                Event Registration
                            </h1>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-12">
                <RegistrationForm />
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
