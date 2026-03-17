import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { Bell, Check, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { subscribeToNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notifications';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const auth = getAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        // Listen for new notifications
        const unsubscribe = subscribeToNotifications(user.uid, (data) => {
            setNotifications(data);
        });

        // Click outside to close
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            unsubscribe();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [auth]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            await markNotificationAsRead(notification.id);
        }

        setIsOpen(false);

        // Routing logic based on type
        if (notification.type === 'booking_approved' || notification.type === 'booking_rejected') {
            navigate('/student-dashboard');
        } else if (notification.type === 'new_booking') {
            navigate('/landlord-dashboard');
        } else if (notification.type === 'new_message') {
            // Optional: pass the ID via state to open that specific chat
            navigate('/student-dashboard');
        }
    };

    const handleMarkAllRead = async (e) => {
        e.stopPropagation();
        const user = auth.currentUser;
        if (user && unreadCount > 0) {
            await markAllNotificationsAsRead(user.uid, notifications);
        }
    };

    return (
        <div className="notification-dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                className="btn btn-icon"
                onClick={() => setIsOpen(!isOpen)}
                style={{ position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                aria-label="Notifications"
            >
                <Bell size={24} color="var(--text-color)" />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '0px', right: '0px',
                        backgroundColor: 'var(--accent-color)', color: 'white',
                        fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '50%',
                        width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid white'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'absolute', top: '100%', right: '0', marginTop: '0.5rem',
                            backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                            width: '350px', zIndex: 1000, overflow: 'hidden', border: '1px solid var(--border-color)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--background-color)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}
                                >
                                    <Check size={14} /> Mark all read
                                </button>
                            )}
                        </div>

                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {notifications.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                                    <Bell size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                                    <p style={{ margin: 0 }}>You have no notifications yet.</p>
                                </div>
                            ) : (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {notifications.map((notif) => (
                                        <li
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            style={{
                                                padding: '1rem', borderBottom: '1px solid var(--border-color)',
                                                backgroundColor: notif.isRead ? 'white' : 'rgba(252, 211, 77, 0.1)',
                                                cursor: 'pointer', transition: 'background-color 0.2s',
                                                display: 'flex', gap: '1rem', alignItems: 'flex-start'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background-color)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notif.isRead ? 'white' : 'rgba(252, 211, 77, 0.1)'}
                                        >
                                            <div style={{
                                                backgroundColor: notif.isRead ? 'var(--background-color)' : 'var(--primary-color)',
                                                color: notif.isRead ? 'var(--text-light)' : 'var(--text-dark)',
                                                padding: '8px', borderRadius: '50%', flexShrink: 0
                                            }}>
                                                <Info size={16} />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: notif.isRead ? '600' : '800' }}>
                                                    {notif.title}
                                                </h4>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: '1.4' }}>
                                                    {notif.message}
                                                </p>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block', marginTop: '0.5rem' }}>
                                                    {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                                </span>
                                            </div>
                                            {!notif.isRead && (
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', flexShrink: 0, alignSelf: 'center', marginLeft: 'auto' }} />
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationDropdown;
