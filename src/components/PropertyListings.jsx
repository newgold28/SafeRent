import React, { useState, useEffect } from 'react';
import { getFirestore, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { bookingService } from '../services/firebase';
import { paystackEscrow } from '../services/paystack';
import PaystackPayment from './PaystackPayment';
import { MapPin, Home, Tag, Video } from 'lucide-react';

const PropertyListings = () => {
    const auth = getAuth();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        type: 'all',
        location: 'Ibadan'
    });

    useEffect(() => {
        const db = getFirestore();
        const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const propertyData = [];
            snapshot.forEach((doc) => {
                propertyData.push({ id: doc.id, ...doc.data() });
            });
            setProperties(propertyData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching properties:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const filteredProperties = properties.filter((prop) => {
        // Requirement 4: Only show approved properties from verified landlords
        if (prop.approvalStatus !== 'approved' || prop.landlordVerified !== true) return false;

        const matchType = filters.type === 'all' || prop.type === filters.type;
        const matchLocation = prop.location.toLowerCase().includes(filters.location.toLowerCase());

        // Price filtering
        const price = Number(prop.price);
        const minP = filters.minPrice ? Number(filters.minPrice) : 0;
        const maxP = filters.maxPrice ? Number(filters.maxPrice) : Infinity;
        const matchPrice = price >= minP && price <= maxP;

        return matchType && matchLocation && matchPrice;
    });

    if (loading) {
        return <div className="text-center py-8">Loading properties...</div>;
    }

    return (
        <div className="mt-8">
            {/* Filters Section */}
            <div className="card mb-8">
                <h3 className="mb-4">Filter Listings</h3>
                <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                        <label className="form-label text-sm">Location</label>
                        <input
                            type="text"
                            name="location"
                            className="form-input"
                            placeholder="Search area in Ibadan..."
                            value={filters.location}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
                        <label className="form-label text-sm">Property Type</label>
                        <select
                            name="type"
                            className="form-input"
                            value={filters.type}
                            onChange={handleFilterChange}
                        >
                            <option value="all">All Types</option>
                            <option value="apartment">Apartment</option>
                            <option value="room">Single Room</option>
                            <option value="house">Entire House</option>
                            <option value="hostel">Hostel Space</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: '1 1 120px', marginBottom: 0 }}>
                        <label className="form-label text-sm">Min Price</label>
                        <input
                            type="number"
                            name="minPrice"
                            className="form-input"
                            placeholder="0"
                            value={filters.minPrice}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="form-group" style={{ flex: '1 1 120px', marginBottom: 0 }}>
                        <label className="form-label text-sm">Max Price</label>
                        <input
                            type="number"
                            name="maxPrice"
                            className="form-input"
                            placeholder="Any"
                            value={filters.maxPrice}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>
            </div>

            {/* Listings Section */}
            <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                {filteredProperties.length === 0 ? (
                    <div className="w-full text-center py-8 text-light">No properties found matching your criteria.</div>
                ) : (
                    filteredProperties.map((prop) => (
                        <div key={prop.id} className="card" style={{ flex: '1 1 300px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                            {/* Image Carousel / Thumbnail logic */}
                            <div style={{ height: '200px', backgroundColor: '#e5e7eb', position: 'relative' }}>
                                {prop.images && prop.images.length > 0 ? (
                                    <img src={prop.images[0]} alt={prop.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div className="flex items-center justify-center h-full w-full text-light">No Image</div>
                                )}
                                <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                    ₦{prop.price.toLocaleString()} / yr
                                </div>
                            </div>

                            {/* Property Details */}
                            <div style={{ padding: '1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 className="mb-2" style={{ fontSize: '1.25rem' }}>{prop.title}</h3>

                                <div className="flex flex-col gap-2 mb-4" style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                                    <div className="flex items-center gap-2"><MapPin size={16} /> {prop.location}</div>
                                    <div className="flex items-center gap-2" style={{ textTransform: 'capitalize' }}><Home size={16} /> {prop.type}</div>
                                    {prop.video && <div className="flex items-center gap-2" style={{ color: 'var(--primary-color)' }}><Video size={16} /> Virtual Tour Available</div>}
                                </div>

                                <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {prop.description}
                                </p>

                                <div className="mt-auto">
                                    {!auth.currentUser ? (
                                        <button
                                            className="btn btn-primary w-full"
                                            onClick={() => alert("Please login as a student to book properties.")}
                                        >
                                            Login to Book
                                        </button>
                                    ) : (
                                        <PaystackPayment
                                            amount={prop.price}
                                            email={auth.currentUser.email}
                                            metadata={paystackEscrow.generateMetadata(prop.id, auth.currentUser.uid, prop.landlordId)}
                                            onSuccess={async (reference) => {
                                                try {
                                                    await bookingService.requestBooking(
                                                        prop.id,
                                                        prop.landlordId,
                                                        auth.currentUser.uid,
                                                        prop.price,
                                                        reference.reference
                                                    );
                                                    alert(`Payment Successful! Reference: ${reference.reference}. Your booking request has been sent.`);
                                                } catch (error) {
                                                    console.error("Booking failed after payment", error);
                                                    alert("Payment was successful but booking registration failed. Please contact support.");
                                                }
                                            }}
                                            onClose={() => {
                                                console.log("Payment window closed");
                                            }}
                                            btnText="Pay & Request Booking"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PropertyListings;
