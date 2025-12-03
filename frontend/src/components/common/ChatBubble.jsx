// frontend/src/components/common/ChatBubble.jsx
import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatWindow from '../../pages/ChatWindow';
import { useAuth } from '../../context/AuthContext';

const ChatBubble = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const { user } = useAuth();

    // Reset unread when opening
    useEffect(() => {
        if (isOpen) {
            setHasUnread(false);
        }
    }, [isOpen]);

    // Ẩn chat bubble nếu user là admin
    if (user?.isAdmin || user?.role === 'admin') {
        return null;
    }

    return (
        <>
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', duration: 0.3 }}
                        className="fixed bottom-24 right-4 z-50 w-[90vw] max-w-[380px] sm:right-6"
                    >
                        <ChatWindow 
                            user={user} 
                            onClose={() => setIsOpen(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    fixed bottom-6 right-4 sm:right-6 z-50
                    w-14 h-14 rounded-full shadow-lg
                    flex items-center justify-center
                    transition-colors duration-200
                    ${isOpen 
                        ? 'bg-gray-700 hover:bg-gray-800' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={isOpen ? 'Đóng chat' : 'Mở chat'}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <>
                        <MessageCircle className="w-6 h-6 text-white" />
                        {hasUnread && (
                            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                        )}
                    </>
                )}
            </motion.button>

            {/* Tooltip (hiển thị khi chưa mở và hover) */}
            {!isOpen && (
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="fixed bottom-8 right-20 sm:right-24 z-40 hidden sm:block"
                >
                    <div className="bg-white px-3 py-2 rounded-lg shadow-md text-sm text-gray-700 whitespace-nowrap">
                        <span className="font-medium">Cần hỗ trợ?</span>
                        <span className="ml-1 text-gray-500">Chat với chúng tôi</span>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                            <div className="border-8 border-transparent border-l-white"></div>
                        </div>
                    </div>
                </motion.div>
            )}
        </>
    );
};

export default ChatBubble;
