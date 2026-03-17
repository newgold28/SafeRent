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
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        type: 'all',
        location: '',
        amenities: [],
        sortBy: 'newest'
    });

    const amenityOptions = [
        { id: 'wifi', label: 'WiFi' },
        { id: 'generator', label: 'Generator' },
        { id: 'water', label: 'Running Water' },
        { id: 'security', label: 'Security' },
        { id: 'parking', label: 'Parking' }
    ];

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

    const handleAmenityToggle = (amenityId) => {
        setFilters(prev => {
            const newAmenities = prev.amenities.includes(amenityId)
                ? prev.amenities.filter(id => id !== amenityId)
                : [...prev.amenities, amenityId];
            return { ...prev, amenities: newAmenities };
        });
    };

    const sortedAndFilteredProperties = properties
        .filter((prop) => {
            // Requirement: Only show approved properties from verified landlords
            if (prop.approvalStatus !== 'approved' || prop.landlordVerified !== true) return false;

            const matchType = filters.type === 'all' || prop.type === filters.type;
            const matchLocation = prop.location.toLowerCase().includes(filters.location.toLowerCase());

            // Price filtering
            const price = Number(prop.price);
            const minP = filters.minPrice ? Number(filters.minPrice) : 0;
            const maxP = filters.maxPrice ? Number(filters.maxPrice) : Infinity;
            const matchPrice = price >= minP && price <= maxP;

            // Amenities filtering
            const matchAmenities = filters.amenities.every(amenity =>
                prop.amenities && prop.amenities.includes(amenity)
            );

            return matchType && matchLocation && matchPrice && matchAmenities;
        })
        .sort((a, b) => {
            if (filters.sortBy === 'priceLow') return a.price - b.price;
            if (filters.sortBy === 'priceHigh') return b.price - a.price;
            if (filters.sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            return 0;
        });

    if (loading) {
        return <div className="text-center py-12">
            <div className="loading-spinner mb-4"></div>
            <p className="text-light">Finding properties...</p>
        </div>;
    }

    return (
        <div className="mt-8">
            {/* Filters Section */}
            <div className="card mb-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="flex items-center gap-2 m-0"><Tag size={20} color="var(--primary-color)" /> Filter Listings</h3>
                    <button
                        className="btn btn-secondary text-sm"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        {showAdvanced ? 'Simple Search' : 'Advanced Filters'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="form-group">
                        <label className="form-label text-sm fw-bold">Location</label>
                        <div className="relative">
                            <MapPin size={16} className="absolute left-3 top-3 text-light" />
                            <input
                                type="text"
                                name="location"
                                className="form-input ps-10"
                                placeholder="Search area..."
                                value={filters.location}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label text-sm fw-bold">Property Type</label>
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
                    <div className="form-group">
                        <label className="form-label text-sm fw-bold">Price Range (₦)</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                name="minPrice"
                                className="form-input"
                                placeholder="Min"
                                value={filters.minPrice}
                                onChange={handleFilterChange}
                            />
                            <span className="text-light">-</span>
                            <input
                                type="number"
                                name="maxPrice"
                                className="form-input"
                                placeholder="Max"
                                value={filters.maxPrice}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label text-sm fw-bold">Sort By</label>
                        <select
                            name="sortBy"
                            className="form-input"
                            value={filters.sortBy}
                            onChange={handleFilterChange}
                        >
                            <option value="newest">Newest First</option>
                            <option value="priceLow">Price: Low to High</option>
                            <option value="priceHigh">Price: High to Low</option>
                        </select>
                    </div>
                </div>

                {showAdvanced && (
                    <div className="mt-6 pt-6 border-top">
                        <label className="form-label text-sm fw-bold mb-3 d-block">Required Amenities</label>
                        <div className="flex flex-wrap gap-4">
                            {amenityOptions.map(option => (
                                <label key={option.id} className="flex items-center gap-2 cursor-pointer bg-light p-2 rounded-lg border hover:border-primary transition-all">
                                    <input
                                        type="checkbox"
                                        checked={filters.amenities.includes(option.id)}
                                        onChange={() => handleAmenityToggle(option.id)}
                                        className="form-checkbox h-4 w-4 text-primary rounded"
                                    />
                                    <span className="text-sm">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
                <p className="text-light m-0">Found <strong>{sortedAndFilteredProperties.length}</strong> properties matching your criteria</p>
            </div>

            {/* Listings Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedAndFilteredProperties.length === 0 ? (
                    <div className="col-span-full card text-center py-12">
                        <div className="mb-4 text-light">
                            <Home size={48} className="mx-auto opacity-20" />
                        </div>
                        <h3>No matches found</h3>
                        <p className="text-light">Try adjusting your filters or location search.</p>
                        <button
                            className="btn btn-secondary mt-4"
                            onClick={() => setFilters({
                                minPrice: '',
                                maxPrice: '',
                                type: 'all',
                                location: '',
                                amenities: [],
                                sortBy: 'newest'
                            })}
                        >
                            Reset All Filters
                        </button>
                    </div>
                ) : (
                    sortedAndFilteredProperties.map((prop) => (
                        <div key={prop.id} className="card property-card group" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                            {/* Image Section */}
                            <div style={{ height: '220px', backgroundColor: '#f3f4f6', position: 'relative', overflow: 'hidden' }}>
                                {prop.images && prop.images.length > 0 ? (
                                    <img
                                        src={prop.images[0]}
                                        alt={prop.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full w-full text-light">
                                        <Home size={40} className="mb-2 opacity-10" />
                                        <span className="text-xs uppercase fw-bold">No Preview Image</span>
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-dark px-3 py-1.5 rounded-full text-sm fw-bold shadow-sm">
                                    ₦{Number(prop.price).toLocaleString()} / yr
                                </div>
                                {prop.isVerfied && (
                                    <div className="absolute top-4 left-4 bg-primary text-dark px-2 py-1 rounded-md text-[10px] fw-bold shadow-sm flex items-center gap-1">
                                        <ShieldCheck size={12} /> VERIFIED
                                    </div>
                                )}
                            </div>

                            {/* Property Details */}
                            <div className="p-5 flex-grow flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="m-0 text-lg hover:text-primary transition-colors cursor-pointer">{prop.title}</h3>
                                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase fw-bold tracking-wider">
                                        {prop.type}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-2 mb-4 text-light text-sm">
                                    <div className="flex items-center gap-2"><MapPin size={14} className="text-primary" /> {prop.location}</div>
                                    {prop.video && <div className="flex items-center gap-2 text-primary fw-bold text-[11px]"><Video size={14} /> VIRTUAL TOUR AVAILABLE</div>}
                                </div>

                                {prop.amenities && prop.amenities.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {prop.amenities.slice(0, 3).map(amenity => (
                                            <span key={amenity} className="text-[10px] bg-primary/10 text-primary-dark px-2 py-0.5 rounded-full capitalize">
                                                • {amenity}
                                            </span>
                                        ))}
                                        {prop.amenities.length > 3 && (
                                            <span className="text-[10px] text-light">+{prop.amenities.length - 3} more</span>
                                        )}
                                    </div>
                                )}

                                <p className="text-sm line-clamp-2 mb-6 text-gray-600 leading-relaxed">
                                    {prop.description}
                                </p>

                                <div className="mt-auto">
                                    {!auth.currentUser ? (
                                        <button
                                            className="btn btn-secondary w-full"
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
                                            btnText="Secure This Home"
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
