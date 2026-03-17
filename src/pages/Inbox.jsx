import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { chatService } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, MessageSquare, Search, ChevronLeft, ShieldCheck, Clock, Users } from 'lucide-react';
import { createNotification } from '../services/notifications';

const Inbox = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [receiverInfo, setReceiverInfo] = useState(null);
    const scrollRef = useRef();
    const auth = getAuth();
    const db = getFirestore();

    // 1. Fetch user's conversations
    useEffect(() => {
        if (!auth.currentUser) return;

        const q = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', auth.currentUser.uid),
            orderBy('lastMessageTime', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const convs = [];
            for (const document of snapshot.docs) {
                const data = document.data();
                const otherUserId = data.participants.find(p => p !== auth.currentUser.uid);

                // Fetch basic info for the other participant
                const userSnap = await getDoc(doc(db, 'users', otherUserId));
                const otherUser = userSnap.exists() ? userSnap.data() : { email: 'User' };

                convs.push({
                    id: document.id,
                    ...data,
                    otherUser: { ...otherUser, id: otherUserId }
                });
            }
            setConversations(convs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [auth.currentUser, db]);

    // 2. Fetch messages for selected conversation
    useEffect(() => {
        if (!selectedConv) return;

        const q = query(
            collection(db, `conversations/${selectedConv.id}/messages`),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = [];
            snapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() });
            });
            setMessages(msgs);
        });

        setReceiverInfo(selectedConv.otherUser);

        return () => unsubscribe();
    }, [selectedConv, db]);

    // 3. Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !auth.currentUser || !selectedConv) return;

        const messageText = newMessage.trim();
        setNewMessage('');

        try {
            await chatService.sendMessage(
                auth.currentUser.uid,
                receiverInfo.id,
                selectedConv.id,
                messageText
            );

            // Notify the receiver
            await createNotification(
                receiverInfo.id,
                "New Message",
                `Message: ${messageText.substring(0, 30)}${messageText.length > 30 ? '...' : ''}`,
                'new_message',
                selectedConv.id
            );
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    if (loading) return (
        <div className="container section text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="loading-spinner" />
            <p className="text-light">Opening your inbox...</p>
        </div>
    );

    return (
        <div className="container section" style={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
            <h2 className="mb-6 flex items-center gap-2"><MessageSquare className="text-primary" /> Messages</h2>

            <div className="card shadow-lg" style={{ flexGrow: 1, display: 'flex', padding: 0, overflow: 'hidden', borderRadius: '24px' }}>

                {/* Conversations Sidebar */}
                <div style={{
                    width: '320px',
                    borderRight: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#fff'
                }}>
                    <div className="p-4 border-bottom">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-3 text-light" />
                            <input
                                type="text"
                                className="form-input ps-10 text-sm"
                                placeholder="Search conversations..."
                                style={{ borderRadius: '12px' }}
                            />
                        </div>
                    </div>

                    <div style={{ overflowY: 'auto', flexGrow: 1 }}>
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center text-light">
                                <p className="text-sm">No conversations yet.</p>
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <div
                                    key={conv.id}
                                    onClick={() => setSelectedConv(conv)}
                                    style={{
                                        padding: '1rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        backgroundColor: selectedConv?.id === conv.id ? 'var(--primary-light)' : 'transparent',
                                        borderLeft: selectedConv?.id === conv.id ? '4px solid var(--primary-color)' : '4px solid transparent'
                                    }}
                                    className="hover:bg-gray-50"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h5 className="m-0 text-sm truncate" style={{ maxWidth: '160px' }}>
                                            {conv.otherUser.email.split('@')[0]}
                                        </h5>
                                        <span className="text-[10px] text-light">
                                            {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="m-0 text-xs text-light truncate" style={{ maxWidth: '240px' }}>
                                            {conv.lastMessage}
                                        </p>
                                        <span className="text-[9px] fw-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 w-fit">
                                            {conv.otherUser.role}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Window */}
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f9fafb' }}>
                    {selectedConv ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 bg-white border-bottom flex justify-between items-center shadow-sm z-10">
                                <div className="flex items-center gap-3">
                                    <div style={{ width: '40px', height: '40px', background: 'var(--primary-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h4 className="m-0 text-sm">{receiverInfo?.email}</h4>
                                        <div className="flex items-center gap-1">
                                            <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                                            <span className="text-[10px] text-light uppercase fw-bold">{receiverInfo?.role}</span>
                                        </div>
                                    </div>
                                </div>
                                {receiverInfo?.verificationStatus === 'approved' && (
                                    <div className="flex items-center gap-1 text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded-full fw-bold border border-green-100">
                                        <ShieldCheck size={12} /> VERIFIED
                                    </div>
                                )}
                            </div>

                            {/* Messages */}
                            <div
                                ref={scrollRef}
                                style={{ flexGrow: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                            >
                                <AnimatePresence>
                                    {messages.map((msg, i) => {
                                        const isMe = msg.senderId === auth.currentUser.uid;
                                        const showDate = i === 0 || new Date(messages[i - 1].timestamp).toDateString() !== new Date(msg.timestamp).toDateString();

                                        return (
                                            <React.Fragment key={msg.id}>
                                                {showDate && (
                                                    <div className="text-center my-4">
                                                        <span className="text-[10px] bg-gray-200 text-gray-500 px-3 py-1 rounded-full uppercase fw-bold tracking-wider">
                                                            {new Date(msg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                )}
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    style={{
                                                        maxWidth: '70%',
                                                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                                                        padding: '0.8rem 1.2rem',
                                                        borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                                        backgroundColor: isMe ? 'var(--primary-color)' : '#fff',
                                                        color: isMe ? 'white' : 'var(--dark-color)',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                        fontSize: '0.95rem',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    {msg.text}
                                                    <div style={{
                                                        fontSize: '0.65rem',
                                                        marginTop: '0.4rem',
                                                        opacity: 0.6,
                                                        textAlign: isMe ? 'right' : 'left',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                                                        gap: '4px'
                                                    }}>
                                                        <Clock size={10} />
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </motion.div>
                                            </React.Fragment>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>

                            {/* Chat Input */}
                            <form
                                onSubmit={handleSendMessage}
                                className="p-4 bg-white border-top flex gap-3 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]"
                            >
                                <input
                                    type="text"
                                    className="form-input flex-grow"
                                    style={{ marginBottom: 0, borderRadius: '16px', padding: '0.8rem 1.2rem' }}
                                    placeholder="Write a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button type="submit" className="btn btn-primary" style={{ borderRadius: '16px', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Send size={20} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                            <div style={{ width: '80px', height: '80px', background: 'var(--primary-light)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <MessageSquare size={40} className="text-primary" />
                            </div>
                            <h3>Your Centralized Inbox</h3>
                            <p className="text-light max-w-xs mx-auto">
                                Chat with landlords, students, and agents in one secure place. Select a conversation to start.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Inbox;
