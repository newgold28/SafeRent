import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { bookingService } from '../services/firebase';
import { getAuth } from 'firebase/auth';
import { Clock, CheckCircle, XCircle, MessageSquare, X, Home } from 'lucide-react';
import { createNotification } from '../services/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import ChatComponent from './ChatComponent';

const BookingManagement = ({ properties = [] }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeChat, setActiveChat] = useState(null); // { studentId, propertyId, studentName }
    const auth = getAuth();
    const db = getFirestore();

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        // Listen for bookings belonging to this landlord
        const q = query(
            collection(db, 'bookings'),
            where('landlordId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const bookingData = [];
            snapshot.forEach((doc) => {
                bookingData.push({ id: doc.id, ...doc.data() });
            });
            // Client-side sort: newest first
            bookingData.sort((a, b) => {
                const timeA = a.createdAt?.seconds || new Date(a.createdAt).getTime() / 1000 || 0;
                const timeB = b.createdAt?.seconds || new Date(b.createdAt).getTime() / 1000 || 0;
                return timeB - timeA;
            });
            setBookings(bookingData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching bookings:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [auth]);

    const handleAction = async (bookingId, status, studentId) => {
        try {
            await bookingService.updateBookingStatus(bookingId, status);

            // Notify the student
            await createNotification(
                studentId,
                `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                `Your booking for property ${bookingId.substring(0, 8)} has been ${status} by the landlord.`,
                status === 'confirmed' ? 'booking_approved' : 'booking_rejected',
                bookingId
            );

            alert(`Booking ${status} successfully.`);
        } catch (error) {
            alert('Failed to update booking status.');
        }
    };

    const renderCountdown = (createdAt) => {
        const createdTime = new Date(createdAt).getTime();
        const expiryTime = createdTime + (24 * 60 * 60 * 1000); // 24 hours
        const now = new Date().getTime();
        const diff = expiryTime - now;

        if (diff <= 0) return <span style={{ color: 'var(--text-light)' }}>Expired</span>;

        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return (
            <span style={{ color: '#F59E0B', fontWeight: 'bold' }}>
                {hours}h {minutes}m remaining
            </span>
        );
    };

    if (loading) return (
        <div className="card text-center py-8">
            <div className="loading-spinner mb-2"></div>
            <p className="text-light text-xs">Loading booking requests...</p>
        </div>
    );

    return (
        <div className="card w-full shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="m-0">Booking Requests</h3>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded fw-bold">NEWEST FIRST</span>
            </div>

            {bookings.length === 0 ? (
                <div className="text-center py-12">
                    <Clock size={40} className="mx-auto text-light opacity-10 mb-3" />
                    <p className="text-light m-0">You have no booking requests yet.</p>
                </div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {bookings.map((booking) => {
                        const property = properties.find(p => p.id === booking.propertyId);
                        return (
                            <li key={booking.id} className="hover:bg-gray-50 transition-colors" style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                <div className="flex gap-4 items-start mb-4">
                                    <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f3f4f6', flexShrink: 0 }}>
                                        {property?.images && property.images[0] ? (
                                            <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-light">
                                                <Home size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="m-0 text-base">{property?.title || `Property: ${booking.propertyId.substring(0, 8)}`}</h4>
                                                <p className="text-xs text-light mb-2">Ref: {booking.id.substring(0, 8).toUpperCase()}</p>
                                            </div>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: '700',
                                                backgroundColor: booking.status === 'pending' ? '#FEF3C7' : booking.status === 'confirmed' ? '#D1FAE5' : '#FEE2E2',
                                                color: booking.status === 'pending' ? '#B45309' : booking.status === 'confirmed' ? '#047857' : '#B91C1C'
                                            }}>
                                                {booking.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1">
                                            <div className="text-sm fw-bold">₦{Number(booking.amount).toLocaleString()}</div>
                                            <button
                                                className="flex items-center gap-1.5 text-xs text-primary fw-bold hover:underline"
                                                onClick={() => setActiveChat({
                                                    studentId: booking.studentId,
                                                    propertyId: booking.propertyId,
                                                    studentName: `Student ${booking.studentId.substring(0, 4)}`
                                                })}
                                            >
                                                <MessageSquare size={14} /> Chat with Student
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {booking.status === 'pending' && (
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2 p-3 bg-white rounded-lg border border-dashed">
                                        <div className="flex items-center gap-2 text-xs">
                                            <Clock size={14} className="text-amber-500" />
                                            <span><strong>Expires in:</strong> {renderCountdown(booking.createdAt)}</span>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <button
                                                className="btn flex-1 flex justify-center items-center gap-2 text-xs py-2"
                                                style={{ backgroundColor: '#10B981', color: 'white' }}
                                                onClick={() => handleAction(booking.id, 'confirmed', booking.studentId)}
                                            >
                                                <CheckCircle size={14} /> Confirm
                                            </button>
                                            <button
                                                className="btn flex-1 flex justify-center items-center gap-2 text-xs py-2"
                                                style={{ backgroundColor: '#EF4444', color: 'white' }}
                                                onClick={() => handleAction(booking.id, 'rejected', booking.studentId)}
                                            >
                                                <XCircle size={14} /> Reject
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* Chat Modal Overlay */}
            <AnimatePresence>
                {activeChat && (
                    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <motion.div
                            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        >
                            <button
                                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full z-10"
                                onClick={() => setActiveChat(null)}
                            >
                                <X size={20} />
                            </button>
                            <div className="p-2">
                                <ChatComponent
                                    receiverId={activeChat.studentId}
                                    propertyId={activeChat.propertyId}
                                    receiverName={activeChat.studentName}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BookingManagement;
