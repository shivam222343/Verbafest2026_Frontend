import React from 'react';
import "../styles/loader.css";

const Loader = ({ fullScreen = false, message = "Loading Content..." }) => {
    const loaderContent = (
        <div className="loader-overlay">
            <div className="premium-loader">
                <div className="loader-glow"></div>
                <div className="circle"></div>
                <div className="circle"></div>
                <div className="circle"></div>
            </div>
            {message && (
                <div className="loader-message">
                    {message}
                </div>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-bg-primary)]/80 backdrop-blur-md">
                {loaderContent}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-[200px] w-full py-12">
            {loaderContent}
        </div>
    );
};

export default Loader;
