import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Phone, Loader2, X, MinusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    initSocket,
    getOrCreateConversation,
    sendMessage as apiSendMessage,
    getMessages,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    onNewAdminMessage,
    onUserTyping,
    onUserStopTyping
} from '../controllers/ChatController';

const ChatWindow = ({ user, onClose, isMinimized, onToggleMinimize }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [conversationId, setConversationId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);

    // Generate or get guestId for anonymous users
    const getGuestId = () => {
        let guestId = localStorage.getItem('chat_guest_id');
        if (!guestId) {
            guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('chat_guest_id', guestId);
        }
        return guestId;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Initialize socket and load conversation
    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Initialize socket
                initSocket();
                
                // Get or create conversation
                // Luôn gửi guestId để đảm bảo hoạt động với cả guest và user
                const data = { 
                    guestId: getGuestId(), 
                    guestName: user?.name || user?.userName || 'Khách' 
                };
                
                const result = await getOrCreateConversation(data);
                
                if (result.success && result.conversation) {
                    const conv = result.conversation;
                    setConversationId(conv._id);
                    
                    // Format messages - với safe date formatting
                    const formatMessageTime = (dateStr) => {
                        if (!dateStr) return '';
                        const d = new Date(dateStr);
                        if (isNaN(d.getTime())) return '';
                        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    };
                    
                    const formattedMessages = conv.messages.map((msg, index) => ({
                        id: msg._id || index,
                        text: msg.text,
                        sender: msg.sender,
                        senderName: msg.senderName,
                        time: formatMessageTime(msg.createdAt),
                        isRead: msg.isRead
                    }));
                    setMessages(formattedMessages);
                    
                    // Join socket room
                    joinConversation(conv._id);
                }
            } catch (err) {
                console.error('Init chat error:', err);
                setError(err.message || 'Không thể kết nối chat');
            } finally {
                setLoading(false);
            }
        };
        
        init();
        
        // Cleanup
        return () => {
            if (conversationId) {
                leaveConversation(conversationId);
            }
        };
    }, [user]);

    // Listen for new admin messages
    useEffect(() => {
        if (!conversationId) return;
        
        const unsubscribe = onNewAdminMessage((data) => {
            if (data.conversationId === conversationId) {
                const newMsg = {
                    id: data.message._id || Date.now(),
                    text: data.message.text,
                    sender: 'admin',
                    senderName: data.message.senderName,
                    time: new Date().toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })
                };
                setMessages(prev => [...prev, newMsg]);
                setIsTyping(false);
            }
        });
        
        return unsubscribe;
    }, [conversationId]);

    // Listen for typing indicators
    useEffect(() => {
        const unsubType = onUserTyping((data) => {
            if (data.conversationId === conversationId && data.sender === 'admin') {
                setIsTyping(true);
                setTypingUser(data.senderName);
            }
        });
        
        const unsubStopType = onUserStopTyping((data) => {
            if (data.conversationId === conversationId && data.sender === 'admin') {
                setIsTyping(false);
                setTypingUser(null);
            }
        });
        
        return () => {
            unsubType();
            unsubStopType();
        };
    }, [conversationId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Handle typing indicator
    const handleInputChange = useCallback((e) => {
        setNewMessage(e.target.value);
        
        if (conversationId && e.target.value.trim()) {
            const senderName = user?.name || user?.userName || 'Khách';
            startTyping(conversationId, 'user', senderName);
            
            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            // Stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                stopTyping(conversationId, 'user');
            }, 2000);
        }
    }, [conversationId, user]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !conversationId || sending) return;

        const messageText = newMessage.trim();
        setNewMessage("");
        setSending(true);
        
        // Stop typing
        stopTyping(conversationId, 'user');
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Optimistic update
        const tempId = Date.now();
        const optimisticMsg = {
            id: tempId,
            text: messageText,
            sender: "user",
            senderName: user?.name || user?.userName || 'Bạn',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            pending: true
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const result = await apiSendMessage(conversationId, messageText);
            
            if (result.success) {
                // Update the optimistic message with real data
                setMessages(prev => prev.map(msg => 
                    msg.id === tempId 
                        ? { ...msg, id: result.message._id || tempId, pending: false }
                        : msg
                ));
            }
        } catch (err) {
            console.error('Send message error:', err);
            // Mark message as failed
            setMessages(prev => prev.map(msg => 
                msg.id === tempId 
                    ? { ...msg, failed: true, pending: false }
                    : msg
            ));
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    // Retry failed message
    const handleRetry = async (failedMsg) => {
        setMessages(prev => prev.filter(m => m.id !== failedMsg.id));
        setNewMessage(failedMsg.text);
        inputRef.current?.focus();
    };

    if (isMinimized) {
        return null;
    }

    return (
        <div className="flex flex-col h-[600px] md:h-[700px] bg-gray-50 rounded-xl overflow-hidden border border-gray-200 shadow-lg">
            {/* Header Chat */}
            <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                            PW
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">Hỗ trợ khách hàng</h3>
                        <p className="text-xs text-green-600 font-medium">
                            {isTyping ? `${typingUser || 'Nhân viên'} đang gõ...` : 'Thường trả lời trong 5 phút'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-1 text-gray-400">
                    <button className="p-2 hover:bg-gray-100 rounded-full"><Phone size={20} /></button>
                    {onToggleMinimize && (
                        <button 
                            onClick={onToggleMinimize}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <MinusCircle size={20} />
                        </button>
                    )}
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full hover:text-red-500"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Nội dung tin nhắn */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f0f2f5]">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <p className="text-red-500 mb-2">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="text-indigo-600 underline"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="text-center text-xs text-gray-400 my-4">Hôm nay</div>
                        
                        <AnimatePresence>
                            {messages.map((msg) => {
                                const isUser = msg.sender === "user";
                                // Hiển thị "PhoneWorld" cho tin nhắn từ admin
                                const displayName = isUser ? msg.senderName : 'PhoneWorld';
                                return (
                                    <motion.div 
                                        key={msg.id} 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm relative group
                                            ${isUser 
                                                ? `bg-indigo-600 text-white rounded-tr-none ${msg.pending ? 'opacity-70' : ''} ${msg.failed ? 'bg-red-500' : ''}` 
                                                : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                                            }
                                        `}>
                                            {!isUser && (
                                                <p className="text-xs text-indigo-600 font-medium mb-1">
                                                    {displayName}
                                                </p>
                                            )}
                                            <p>{msg.text}</p>
                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                <span className={`text-[10px] opacity-70 ${isUser ? 'text-indigo-100' : 'text-gray-400'}`}>
                                                    {msg.time}
                                                </span>
                                                {msg.pending && (
                                                    <Loader2 className="w-3 h-3 animate-spin text-white" />
                                                )}
                                                {msg.failed && (
                                                    <button 
                                                        onClick={() => handleRetry(msg)}
                                                        className="text-xs underline text-white ml-1"
                                                    >
                                                        Thử lại
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        
                        {/* Typing indicator */}
                        {isTyping && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start"
                            >
                                <div className="bg-white text-gray-800 rounded-2xl rounded-tl-none border border-gray-100 px-4 py-2.5 shadow-sm">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="bg-white p-3 border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <button type="button" className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-full transition">
                        <Paperclip size={20} />
                    </button>
                    <div className="flex-1 relative">
                        <input 
                            ref={inputRef}
                            type="text" 
                            value={newMessage}
                            onChange={handleInputChange}
                            placeholder="Nhập tin nhắn..."
                            disabled={loading || !!error}
                            className="w-full bg-gray-100 text-gray-800 text-sm rounded-full pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition disabled:opacity-50"
                        />
                        <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-500">
                            <Smile size={20} />
                        </button>
                    </div>
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim() || loading || sending}
                        className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-indigo-200"
                    >
                        {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;