import React from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useMessage, useAuth } from '@/contexts';

export const FloatingChat = () => {
    const { setShowMessageModal, showMessageModal } = useMessage();
    const { user } = useAuth();

    // Only show if logged in as customer? Or show nicely to prompt login?
    // User asked for "message functionality", usually requires auth.
    // If not logged in, maybe it prompts login.
    // The MessageModal handles data fetching.

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Modern Chat Bubble */}
            <button
                onClick={() => setShowMessageModal(true)}
                className={`group flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none ${showMessageModal
                        ? 'bg-red-500 hover:bg-red-600 rotate-90'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
            >
                {showMessageModal ? (
                    <X className="text-white w-6 h-6" />
                ) : (
                    <MessageSquare className="text-white w-6 h-6" />
                )}

                {/* Pulse effect if closed */}
                {!showMessageModal && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-25 animate-ping"></span>
                )}
            </button>

            {/* Label to prompt user */}
            {!showMessageModal && (
                <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-lg text-sm font-medium shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
                    Chat with us
                    <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-white dark:border-l-gray-800"></div>
                </div>
            )}
        </div>
    );
};
