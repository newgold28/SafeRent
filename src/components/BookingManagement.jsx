import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { bookingService } from '../services/firebase';
import { getAuth } from 'firebase/auth';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

const BookingManagement = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const auth = getAuth();
    const db = getFirestore();

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        // Listen for bookings belonging to this landlord
        const q = query(
            collection(db, 'bookings'),
            where('landlordId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const bookingData = [];
            snapshot.forEach((doc) => {
                bookingData.push({ id: doc.id, ...doc.data() });
            });
            setBookings(bookingData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching bookings:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [auth]);

    const handleAction = async (bookingId, status) => {
        try {
            await bookingService.updateBookingStatus(bookingId, status);
            // Optionally, we could dispatch a notification here
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

    if (loading) return <div>Loading booking requests...</div>;

    return (
        <div className="card w-full">
            <h3 className="mb-4">Booking Requests</h3>
            {bookings.length === 0 ? (
                <p className="text-light">You have no booking requests yet.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {bookings.map((booking) => (
                        <li key={booking.id} style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <strong style={{ fontSize: '1.1rem' }}>Property ID: {booking.propertyId.substring(0, 8)}...</strong>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold',
                                        backgroundColor: booking.status === 'pending' ? '#FEF3C7' : booking.status === 'confirmed' ? '#D1FAE5' : '#FEE2E2',
                                        color: booking.status === 'pending' ? '#B45309' : booking.status === 'confirmed' ? '#047857' : '#B91C1C'
                                    }}>
                                        {booking.status.toUpperCase()}
                                    </span>
                                </div>
                                <p style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                                    Student ID: {booking.studentId.substring(0, 8)}...
                                </p>
                                <p><strong>Escrow Amount:</strong> ₦{Number(booking.amount).toLocaleString()}</p>
                            </div>

                            <div className="flex flex-col items-end gap-4" style={{ minWidth: '200px' }}>
                                {booking.status === 'pending' && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} color="#F59E0B" /> {renderCountdown(booking.createdAt)}
                                        </div>
                                        <div className="flex gap-4 w-full">
                                            <button
                                                className="btn flex-1 flex justify-center items-center gap-2"
                                                style={{ backgroundColor: '#10B981', color: 'white' }}
                                                onClick={() => handleAction(booking.id, 'confirmed')}
                                            >
                                                <CheckCircle size={16} /> Confirm
                                            </button>
                                            <button
                                                className="btn flex-1 flex justify-center items-center gap-2"
                                                style={{ backgroundColor: '#EF4444', color: 'white' }}
                                                onClick={() => handleAction(booking.id, 'rejected')}
                                            >
                                                <XCircle size={16} /> Reject
                                            </button>
                                        </div>
                                    </>
                                )}
                                {booking.status === 'confirmed' && (
                                    <p className="text-light" style={{ fontSize: '0.9rem' }}>Property Locked. Payment release scheduled 24-48h post move-in.</p>
                                )}
                                {booking.status === 'rejected' && (
                                    <p className="text-light" style={{ fontSize: '0.9rem' }}>Refund automatically initiated to student.</p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default BookingManagement;
