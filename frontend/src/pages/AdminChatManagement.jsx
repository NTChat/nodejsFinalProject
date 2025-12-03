// frontend/src/pages/AdminChatManagement.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    MessageSquare, Search, Send, User, Clock, CheckCircle, 
    XCircle, Loader2, RefreshCw, Trash2, Tag, MoreVertical,
    ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    initSocket,
    getAllConversations,
    adminSendMessage,
    markAsRead,
    updateConversationStatus,
    deleteConversation,
    adminJoinRoom,
    adminJoinConversation,
    onNewCustomerMessage,
    onUserTyping,
    onUserStopTyping,
    startTyping,
    stopTyping
} from '../controllers/ChatController';

const AdminChatManagement = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [unreadTotal, setUnreadTotal] = useState(0);
    const [typingConversations, setTypingConversations] = useState(new Set());
    const [showMobileList, setShowMobileList] = useState(true);
    
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Load conversations
    const loadConversations = useCallback(async () => {
        try {
            setLoading(true);
            console.log('Loading conversations with filter:', filter);
            const result = await getAllConversations(filter);
            console.log('getAllConversations result:', result);
            if (result.success) {
                setConversations(result.conversations || []);
                setUnreadTotal(result.unreadTotal || 0);
            } else {
                console.error('API returned success: false', result);
            }
        } catch (err) {
            console.error('Load conversations error:', err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    // Initialize
    useEffect(() => {
        initSocket();
        adminJoinRoom();
        loadConversations();
    }, [loadConversations]);

    // Listen for new customer messages
    useEffect(() => {
        const unsubscribe = onNewCustomerMessage((data) => {
            // Update conversations list
            setConversations(prev => {
                const updated = prev.map(conv => {
                    if (conv._id === data.conversationId) {
                        return {
                            ...conv,
                            messages: [...(conv.messages || []), data.message],
                            lastMessage: {
                                text: data.message.text,
                                sender: 'user',
                                createdAt: new Date()
                            },
                            unreadCount: (conv.unreadCount || 0) + 1,
                            status: 'pending'
                        };
                    }
                    return conv;
                });
                // Move updated conversation to top
                return updated.sort((a, b) => 
                    new Date(b.updatedAt) - new Date(a.updatedAt)
                );
            });

            // If this conversation is selected, update it too
            if (selectedConversation?._id === data.conversationId) {
                setSelectedConversation(prev => ({
                    ...prev,
                    messages: [...(prev.messages || []), data.message]
                }));
            }

            setUnreadTotal(prev => prev + 1);
        });

        return unsubscribe;
    }, [selectedConversation]);

    // Listen for typing
    useEffect(() => {
        const unsubType = onUserTyping((data) => {
            if (data.sender === 'user') {
                setTypingConversations(prev => new Set([...prev, data.conversationId]));
            }
        });

        const unsubStopType = onUserStopTyping((data) => {
            if (data.sender === 'user') {
                setTypingConversations(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(data.conversationId);
                    return newSet;
                });
            }
        });

        return () => {
            unsubType();
            unsubStopType();
        };
    }, []);

    // Scroll when selected conversation messages change
    useEffect(() => {
        scrollToBottom();
    }, [selectedConversation?.messages]);

    // Select conversation
    const handleSelectConversation = async (conv) => {
        setSelectedConversation(conv);
        setShowMobileList(false);
        adminJoinConversation(conv._id);

        // Mark as read
        if (conv.unreadCount > 0) {
            try {
                await markAsRead(conv._id);
                setConversations(prev => prev.map(c => 
                    c._id === conv._id ? { ...c, unreadCount: 0 } : c
                ));
                setUnreadTotal(prev => Math.max(0, prev - conv.unreadCount));
            } catch (err) {
                console.error('Mark as read error:', err);
            }
        }
    };

    // Send message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || sending) return;

        const messageText = newMessage.trim();
        setNewMessage('');
        setSending(true);

        // Stop typing
        stopTyping(selectedConversation._id, 'admin');

        try {
            const result = await adminSendMessage(selectedConversation._id, messageText);
            if (result.success) {
                // Update selected conversation
                setSelectedConversation(prev => ({
                    ...prev,
                    messages: [...(prev.messages || []), result.message]
                }));

                // Update conversations list
                setConversations(prev => prev.map(c => 
                    c._id === selectedConversation._id 
                        ? {
                            ...c,
                            lastMessage: { text: messageText, sender: 'admin', createdAt: new Date() }
                        }
                        : c
                ));
            }
        } catch (err) {
            console.error('Send message error:', err);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    // Handle input change with typing indicator
    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        
        if (selectedConversation && e.target.value.trim()) {
            startTyping(selectedConversation._id, 'admin', 'Hỗ trợ viên');
            
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            typingTimeoutRef.current = setTimeout(() => {
                stopTyping(selectedConversation._id, 'admin');
            }, 2000);
        }
    };

    // Update status
    const handleUpdateStatus = async (convId, status) => {
        try {
            await updateConversationStatus(convId, { status });
            setConversations(prev => prev.map(c => 
                c._id === convId ? { ...c, status } : c
            ));
            if (selectedConversation?._id === convId) {
                setSelectedConversation(prev => ({ ...prev, status }));
            }
        } catch (err) {
            console.error('Update status error:', err);
        }
    };

    // Delete conversation
    const handleDeleteConversation = async (convId) => {
        if (!window.confirm('Bạn có chắc muốn xóa cuộc hội thoại này?')) return;
        
        try {
            await deleteConversation(convId);
            setConversations(prev => prev.filter(c => c._id !== convId));
            if (selectedConversation?._id === convId) {
                setSelectedConversation(null);
                setShowMobileList(true);
            }
        } catch (err) {
            console.error('Delete conversation error:', err);
        }
    };

    // Filter conversations
    const filteredConversations = conversations.filter(conv => {
        const name = conv.guestName || conv.userId?.name || conv.userId?.userName || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Get status badge
    const getStatusBadge = (status) => {
        const badges = {
            open: { color: 'bg-blue-100 text-blue-700', label: 'Mở' },
            pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Chờ xử lý' },
            resolved: { color: 'bg-green-100 text-green-700', label: 'Đã xử lý' },
            closed: { color: 'bg-gray-100 text-gray-700', label: 'Đóng' }
        };
        const badge = badges[status] || badges.open;
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    // Format time
    const formatTime = (date) => {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return ''; // Invalid date
        const now = new Date();
        const diff = now - d;
        
        if (diff < 60000) return 'Vừa xong';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} phút`;
        if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="bg-white p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-indigo-600" />
                    <h1 className="text-xl font-bold text-gray-800">Quản lý Chat</h1>
                    {unreadTotal > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {unreadTotal}
                        </span>
                    )}
                </div>
                <button 
                    onClick={loadConversations}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                    title="Làm mới"
                >
                    <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Conversation List */}
                <div className={`
                    w-full md:w-80 lg:w-96 border-r bg-white flex flex-col
                    ${showMobileList ? 'block' : 'hidden md:flex'}
                `}>
                    {/* Search & Filter */}
                    <div className="p-3 border-b space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm kiếm..."
                                className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto">
                            {[
                                { value: 'all', label: 'Tất cả' },
                                { value: 'pending', label: 'Chờ xử lý' },
                                { value: 'open', label: 'Mở' },
                                { value: 'resolved', label: 'Đã xử lý' }
                            ].map(f => (
                                <button
                                    key={f.value}
                                    onClick={() => setFilter(f.value)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                                        filter === f.value 
                                            ? 'bg-indigo-600 text-white' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="text-center text-gray-500 py-10">
                                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>Không có cuộc hội thoại nào</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredConversations.map(conv => {
                                    const customerName = conv.userId?.name || conv.userId?.userName || conv.guestName || 'Khách';
                                    const isTyping = typingConversations.has(conv._id);
                                    const isSelected = selectedConversation?._id === conv._id;
                                    
                                    return (
                                        <div
                                            key={conv._id}
                                            onClick={() => handleSelectConversation(conv)}
                                            className={`p-3 cursor-pointer hover:bg-gray-50 transition ${
                                                isSelected ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="relative">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                        {customerName[0]?.toUpperCase()}
                                                    </div>
                                                    {conv.unreadCount > 0 && (
                                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-medium text-gray-800 truncate">
                                                            {customerName}
                                                        </h4>
                                                        <span className="text-xs text-gray-400">
                                                            {formatTime(conv.updatedAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate mt-0.5">
                                                        {isTyping ? (
                                                            <span className="text-indigo-600 italic">Đang gõ...</span>
                                                        ) : (
                                                            conv.lastMessage?.text || 'Bắt đầu cuộc trò chuyện'
                                                        )}
                                                    </p>
                                                    <div className="mt-1">
                                                        {getStatusBadge(conv.status)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`
                    flex-1 flex flex-col bg-gray-50
                    ${!showMobileList ? 'block' : 'hidden md:flex'}
                `}>
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="bg-white p-4 border-b flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setShowMobileList(true)}
                                        className="md:hidden p-1 hover:bg-gray-100 rounded"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {(selectedConversation.userId?.name || selectedConversation.guestName || 'K')[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">
                                            {selectedConversation.userId?.name || selectedConversation.userId?.userName || selectedConversation.guestName || 'Khách'}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            {selectedConversation.guestEmail || selectedConversation.userId?.email || ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(selectedConversation.status)}
                                    <div className="relative group">
                                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                                            <MoreVertical className="w-5 h-5 text-gray-600" />
                                        </button>
                                        <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 min-w-[150px] hidden group-hover:block z-10">
                                            {selectedConversation.status !== 'resolved' && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(selectedConversation._id, 'resolved')}
                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                    Đánh dấu đã xử lý
                                                </button>
                                            )}
                                            {selectedConversation.status !== 'closed' && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(selectedConversation._id, 'closed')}
                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <XCircle className="w-4 h-4 text-gray-600" />
                                                    Đóng hội thoại
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDeleteConversation(selectedConversation._id)}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Xóa hội thoại
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                <AnimatePresence>
                                    {selectedConversation.messages?.map((msg, index) => {
                                        const isAdmin = msg.sender === 'admin';
                                        return (
                                            <motion.div
                                                key={msg._id || index}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                                                    isAdmin 
                                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                                        : 'bg-white text-gray-800 rounded-tl-none border'
                                                }`}>
                                                    {!isAdmin && (
                                                        <p className="text-xs text-indigo-600 font-medium mb-1">
                                                            {msg.senderName || 'Khách'}
                                                        </p>
                                                    )}
                                                    <p>{msg.text}</p>
                                                    <span className={`text-[10px] block text-right mt-1 opacity-70 ${
                                                        isAdmin ? 'text-indigo-100' : 'text-gray-400'
                                                    }`}>
                                                        {msg.createdAt && !isNaN(new Date(msg.createdAt).getTime()) 
                                                            ? new Date(msg.createdAt).toLocaleTimeString([], { 
                                                                hour: '2-digit', 
                                                                minute: '2-digit' 
                                                            })
                                                            : ''}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>

                                {/* Typing indicator */}
                                {typingConversations.has(selectedConversation._id) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex justify-start"
                                    >
                                        <div className="bg-white px-4 py-2.5 rounded-2xl rounded-tl-none border shadow-sm">
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="bg-white p-3 border-t">
                                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={newMessage}
                                            onChange={handleInputChange}
                                            placeholder="Nhập tin nhắn..."
                                            className="w-full bg-gray-100 text-gray-800 text-sm rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || sending}
                                        className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
                                    >
                                        {sending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg">Chọn một cuộc hội thoại để bắt đầu</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminChatManagement;
