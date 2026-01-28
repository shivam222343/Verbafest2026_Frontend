import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

const Input = forwardRef(({
    label,
    error,
    helperText,
    icon: Icon,
    rightIcon: RightIcon,
    rightElement,
    className = '',
    containerClassName = '',
    type = 'text',
    ...props
}, ref) => {
    const inputStyles = clsx(
        'w-full px-4 py-2.5 rounded-lg transition-smooth',
        'bg-[var(--input-bg)] border border-[var(--input-border)]',
        'text-[var(--input-text)] placeholder:text-[var(--input-placeholder)]',
        'focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-border)] focus:border-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        Icon && 'pl-11',
        (RightIcon || rightElement) && 'pr-11',
        error && 'border-status-busy focus:ring-status-busy',
        className
    );

    return (
        <div className={clsx('w-full', containerClassName)}>
            {label && (
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    {label}
                </label>
            )}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-mindSaga-500 transition-colors">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
                <input
                    ref={ref}
                    type={type}
                    className={inputStyles}
                    {...props}
                />
                {rightElement ? (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        {rightElement}
                    </div>
                ) : RightIcon && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-mindSaga-500 transition-colors">
                        <RightIcon className="w-5 h-5" />
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1.5 text-sm text-status-busy">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">{helperText}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
