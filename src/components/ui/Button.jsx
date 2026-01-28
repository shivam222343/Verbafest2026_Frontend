import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    loading = false,
    onClick,
    type = 'button',
    ...props
}) => {
    const baseStyles = 'font-medium rounded-lg transition-smooth focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

    const variants = {
        primary: 'bg-mindSaga-600 hover:bg-mindSaga-700 text-white focus:ring-mindSaga-500',
        secondary: 'bg-gd-600 hover:bg-gd-700 text-white focus:ring-gd-500',
        danger: 'bg-status-busy hover:bg-red-600 text-white focus:ring-red-500',
        success: 'bg-status-available hover:bg-green-600 text-white focus:ring-green-500',
        outline: 'border-2 border-mindSaga-500 text-mindSaga-500 hover:bg-mindSaga-500 hover:text-white focus:ring-mindSaga-500',
        ghost: 'text-dark-300 hover:bg-dark-800 focus:ring-dark-700',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={clsx(
                baseStyles,
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {loading && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </motion.button>
    );
};

export default Button;
