import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading,
    fullWidth,
    className = '',
    disabled,
    ...props
}) => {
    const btnClass = `btn btn-${variant} btn-${size} ${fullWidth ? 'w-full' : ''} ${className}`;

    return (
        <button
            className={btnClass}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? (
                <span className="spinner">⟳</span>
            ) : null}
            {children}
        </button>
    );
};
