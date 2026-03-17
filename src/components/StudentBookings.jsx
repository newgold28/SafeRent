import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Home, Clock } from 'lucide-react';

const StudentBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const auth = getAuth();
    const db = getFirestore();

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
            collection(db, 'bookings'),
            where('studentId', '==', user.uid)
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
            console.error("Error fetching student bookings:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [auth]);

    const renderCountdown = (createdAt) => {
        const createdTime = new Date(createdAt).getTime();
        const expiryTime = createdTime + (24 * 60 * 60 * 1000);
        const now = new Date().getTime();
        const diff = expiryTime - now;

        if (diff <= 0) return <span style={{ color: 'var(--text-light)' }}>Expired</span>;

        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return (
            <span style={{ color: '#F59E0B', fontWeight: 'bold' }}>
                {hours}h {minutes}m until expiration
            </span>
        );
    };

    if (loading) return <div>Loading active bookings...</div>;

    return (
        <div className="card" style={{ flex: '2 1 500px' }}>
            <h3 className="mb-4 flex items-center gap-4"><Home /> My Bookings</h3>
            {bookings.length === 0 ? (
                <p className="text-light">You have no active bookings.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {bookings.map((booking) => (
                        <li key={booking.id} className="flex justify-between items-center" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
                            <div className="flex items-center gap-4">
                                <Home color="var(--primary-color)" size={32} />
                                <div>
                                    <strong style={{ fontSize: '1.1rem' }}>Property ID: {booking.propertyId.substring(0, 8)}</strong>
                                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', margin: '0.25rem 0' }}>
                                        Landlord ID: {booking.landlordId.substring(0, 8)}
                                    </p>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Status:
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold',
                                            backgroundColor: booking.status === 'pending' ? '#FEF3C7' : booking.status === 'confirmed' ? '#D1FAE5' : '#FEE2E2',
                                            color: booking.status === 'pending' ? '#B45309' : booking.status === 'confirmed' ? '#047857' : '#B91C1C'
                                        }}>
                                            {booking.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <strong style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-color)' }}>Amount: ₦{Number(booking.amount).toLocaleString()}</strong>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2" style={{ minWidth: '150px' }}>
                                {booking.status === 'pending' && (
                                    <div className="flex items-center gap-2" style={{ fontSize: '0.9rem' }}>
                                        <Clock size={16} color="#F59E0B" /> {renderCountdown(booking.createdAt)}
                                    </div>
                                )}
                                {booking.status === 'confirmed' && (
                                    <div className="text-sm" style={{ color: '#047857', fontWeight: 'bold' }}>Move-in Locked In!</div>
                                )}
                                {booking.status === 'rejected' && (
                                    <div className="text-sm" style={{ color: '#B91C1C' }}>Refund Processing</div>
                                )}
                                <button className="btn btn-secondary mt-2 w-full" disabled={booking.status === 'rejected'} style={{ opacity: booking.status === 'rejected' ? 0.5 : 1 }}>
                                    View Details
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default StudentBookings;
