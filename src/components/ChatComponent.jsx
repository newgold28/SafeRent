import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { chatService } from '../services/firebase';
import { Send, User } from 'lucide-react';

const ChatComponent = ({ receiverId, propertyId, receiverName = "User" }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef();
    const auth = getAuth();
    const db = getFirestore();

    useEffect(() => {
        const user = auth.currentUser;
        if (!user || !receiverId || !propertyId) return;

        // Query messages involving both users for this specific property
        // Note: For a real app, you might want a more complex query or a 'conversations' collection
        const q = query(
            collection(db, 'messages'),
            where('propertyId', '==', propertyId),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                // Filter client-side to ensure privacy (only show messages for this pair)
                if (
                    (data.senderId === user.uid && data.receiverId === receiverId) ||
                    (data.senderId === receiverId && data.receiverId === user.uid)
                ) {
                    msgs.push({ id: doc.id, ...data });
                }
            });
            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching messages:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [auth, receiverId, propertyId]);

    useEffect(() => {
        // Auto-scroll to bottom on new message
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !auth.currentUser) return;

        try {
            await chatService.sendMessage(
                auth.currentUser.uid,
                receiverId,
                propertyId,
                newMessage
            );
            setNewMessage('');
        } catch (error) {
            alert("Failed to send message.");
        }
    };

    if (loading) return <div className="p-4 text-center">Loading chat...</div>;

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '400px', padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div className="flex items-center gap-3" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#f9fafb' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={18} />
                </div>
                <strong>{receiverName}</strong>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                style={{ flexGrow: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
            >
                {messages.length === 0 ? (
                    <p className="text-center text-light mt-4">No messages yet. Say hello!</p>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === auth.currentUser.uid;
                        return (
                            <div
                                key={msg.id}
                                style={{
                                    maxWidth: '80%',
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '12px',
                                    fontSize: '0.9rem',
                                    backgroundColor: isMe ? 'var(--primary-color)' : '#f3f4f6',
                                    color: isMe ? 'white' : 'var(--text-color)',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                            >
                                {msg.text}
                                <div style={{ fontSize: '0.7rem', marginTop: '0.25rem', opacity: 0.7, textAlign: 'right' }}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <form
                onSubmit={handleSendMessage}
                style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem' }}
            >
                <input
                    type="text"
                    className="form-input"
                    style={{ marginBottom: 0 }}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default ChatComponent;
