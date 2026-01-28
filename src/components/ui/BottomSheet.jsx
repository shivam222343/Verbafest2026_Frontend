import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose } from 'react-icons/md';

const BottomSheet = ({ isOpen, onClose, title, children }) => {
    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-[70] bg-[var(--color-bg-primary)] border-t border-[var(--glass-border)] rounded-t-[2.5rem] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
                    >
                        {/* Drag Handle */}
                        <div className="flex justify-center p-3">
                            <div className="w-12 h-1.5 bg-[var(--color-bg-tertiary)] rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="px-6 pb-4 flex items-center justify-between border-b border-[var(--glass-border)]">
                            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{title}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-[var(--color-bg-tertiary)] transition-smooth"
                            >
                                <MdClose className="w-6 h-6 text-[var(--color-text-muted)]" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default BottomSheet;
