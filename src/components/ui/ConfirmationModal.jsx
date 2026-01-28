import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger', // danger, warning, info
    loading = false,
    children
}) => {
    if (!isOpen) return null;

    const colors = {
        danger: 'text-status-busy bg-status-busy/10 border-status-busy/20',
        warning: 'text-debate-600 bg-debate-600/10 border-debate-600/20',
        info: 'text-mindSaga-500 bg-mindSaga-500/10 border-mindSaga-500/20'
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-[var(--color-bg-primary)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--glass-border)]"
                >
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className={`p-3 rounded-2xl border ${colors[type]}`}>
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[var(--color-bg-tertiary)] rounded-xl transition-colors text-[var(--color-text-muted)]"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                            {title}
                        </h3>
                        <p className="text-[var(--color-text-secondary)]">
                            {message}
                        </p>
                        {children}
                    </div>

                    <div className="p-6 bg-[var(--color-bg-tertiary)] flex gap-3">
                        <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={onClose}
                            disabled={loading}
                        >
                            {cancelText}
                        </Button>
                        <Button
                            variant={type === 'danger' ? 'danger' : 'primary'}
                            className="flex-1"
                            onClick={onConfirm}
                            loading={loading}
                            disabled={loading}
                        >
                            {confirmText}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ConfirmationModal;
