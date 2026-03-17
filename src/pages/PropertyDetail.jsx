import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Home, Tag, Video, Share2, Heart,
    ChevronLeft, ChevronRight, ShieldCheck,
    MessageSquare, Calendar, Info, CheckCircle2
} from 'lucide-react';
import PaystackPayment from '../components/PaystackPayment';
import { paystackEscrow } from '../services/paystack';
import { bookingService, chatService } from '../services/firebase';

const PropertyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [showVideo, setShowVideo] = useState(false);
    const auth = getAuth();

    useEffect(() => {
        const fetchProperty = async () => {
            const db = getFirestore();
            const docRef = doc(db, 'properties', id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setProperty({ id: docSnap.id, ...docSnap.data() });
            } else {
                console.error("No such property!");
            }
            setLoading(false);
        };

        fetchProperty();
    }, [id]);

    if (loading) {
        return (
            <div className="container section text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="loading-spinner" />
                <p className="text-light">Loading property details...</p>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="container section text-center">
                <h3>Property Not Found</h3>
                <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>Back to Listings</button>
            </div>
        );
    }

    const nextImage = () => {
        setActiveImage((prev) => (prev === property.images.length - 1 ? 0 : prev + 1));
    };

    const prevImage = () => {
        setActiveImage((prev) => (prev === 0 ? property.images.length - 1 : prev - 1));
    };

    const handleChat = async () => {
        if (!auth.currentUser) {
            navigate('/login');
            return;
        }
        try {
            await chatService.initiateConversation(auth.currentUser.uid, property.landlordId);
            navigate('/inbox');
        } catch (error) {
            console.error("Error starting chat:", error);
        }
    };

    return (
        <div className="container section">
            {/* Back Navigation */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 mb-6 text-sm fw-bold text-light hover:text-dark transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
                <ChevronLeft size={18} /> Back to Listings
            </button>

            <div className="grid gap-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start' }}>

                {/* Left Column: Media & Info */}
                <div className="flex flex-col gap-8">

                    {/* Hero Gallery / Video Player */}
                    <div className="card shadow-lg" style={{ padding: 0, overflow: 'hidden', position: 'relative', borderRadius: '24px' }}>
                        <AnimatePresence mode="wait">
                            {showVideo && property.video ? (
                                <motion.div
                                    key="video"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{ aspectRatio: '16/9', backgroundColor: '#000' }}
                                >
                                    <video
                                        src={property.video}
                                        controls
                                        autoPlay
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="image"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="relative"
                                    style={{ aspectRatio: '16/9' }}
                                >
                                    <img
                                        src={property.images[activeImage]}
                                        alt={property.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />

                                    {property.images.length > 1 && (
                                        <>
                                            <button
                                                onClick={prevImage}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <button
                                                onClick={nextImage}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                                {property.images.map((_, i) => (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            backgroundColor: i === activeImage ? 'var(--primary-color)' : 'rgba(255,255,255,0.5)',
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Media Toggles */}
                        <div className="absolute top-4 right-4 flex gap-2">
                            {property.video && (
                                <button
                                    onClick={() => setShowVideo(!showVideo)}
                                    className={`btn flex items-center gap-2 text-sm ${showVideo ? 'btn-primary' : 'bg-white/90 shadow-sm'}`}
                                >
                                    {showVideo ? <Home size={16} /> : <Video size={16} />}
                                    {showVideo ? 'Show Photos' : 'Virtual Tour'}
                                </button>
                            )}
                            <button className="bg-white/90 p-2 rounded-lg shadow-sm hover:bg-white"><Share2 size={18} /></button>
                            <button className="bg-white/90 p-2 rounded-lg shadow-sm hover:bg-white text-red-500"><Heart size={18} /></button>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="card shadow-sm">
                        <h2 className="mb-4">About this Home</h2>
                        <p className="text-gray-600 leading-relaxed" style={{ fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>
                            {property.description}
                        </p>

                        <div className="mt-8 pt-8 border-top">
                            <h4 className="mb-4 flex items-center gap-2"><Info size={18} className="text-primary" /> Amenities</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {property.amenities?.map(amenity => (
                                    <div key={amenity} className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-xl border">
                                        <CheckCircle2 size={16} className="text-green-500" />
                                        <span className="capitalize">{amenity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Live Location Map */}
                    <div className="card shadow-sm">
                        <h4 className="mb-4 flex items-center gap-2"><MapPin size={18} className="text-primary" /> Location</h4>
                        <p className="text-sm text-light mb-4">{property.location}</p>
                        <div style={{ width: '100%', height: '300px', borderRadius: '16px', overflow: 'hidden' }}>
                            <iframe
                                title="Property Location"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                src={`https://maps.google.com/maps?q=${property.gpsLatitude},${property.gpsLongitude}&z=16&output=embed`}
                            ></iframe>
                        </div>
                    </div>
                </div>

                {/* Right Column: Pricing & Booking */}
                <div className="flex flex-col gap-6" style={{ position: 'sticky', top: '2rem' }}>

                    {/* Booking Card */}
                    <div className="card shadow-md border-2" style={{ borderColor: 'var(--primary-color)' }}>
                        <div className="mb-6">
                            <span className="text-light text-sm fw-bold uppercase px-0 d-block mb-1">Price per year</span>
                            <div className="flex items-baseline gap-2">
                                <h1 className="m-0" style={{ color: 'var(--primary-hover)' }}>₦{Number(property.price).toLocaleString()}</h1>
                                <span className="text-light">/ Year</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 mb-8">
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border">
                                <ShieldCheck size={24} className="text-primary" />
                                <div>
                                    <div className="text-xs fw-bold uppercase tracking-wider text-light">Booking Safety</div>
                                    <div className="text-sm fw-bold">100% Escrow Protection</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border">
                                <Calendar size={24} className="text-primary" />
                                <div>
                                    <div className="text-xs fw-bold uppercase tracking-wider text-light">Availability</div>
                                    <div className="text-sm fw-bold">Ready for Move-in</div>
                                </div>
                            </div>
                        </div>

                        {!auth.currentUser ? (
                            <button
                                className="btn btn-primary w-full py-4 text-lg"
                                onClick={() => navigate('/login')}
                            >
                                Login to Secure This Home
                            </button>
                        ) : (
                            <PaystackPayment
                                amount={property.price}
                                email={auth.currentUser.email}
                                metadata={paystackEscrow.generateMetadata(property.id, auth.currentUser.uid, property.landlordId)}
                                onSuccess={async (reference) => {
                                    try {
                                        await bookingService.requestBooking(
                                            property.id,
                                            property.landlordId,
                                            auth.currentUser.uid,
                                            property.price,
                                            reference.reference
                                        );
                                        navigate('/student-dashboard');
                                    } catch (error) {
                                        console.error("Booking registration failed", error);
                                    }
                                }}
                                btnText="Pay & Secure This Home"
                                className="btn btn-primary w-full py-4 text-lg shadow-lg hover:shadow-xl transition-all"
                            />
                        )}

                        <p className="text-center text-xs text-light mt-4">
                            Funds are held in Escrow and only released to the landlord after you move in.
                        </p>
                    </div>

                    {/* Landlord Trust Card */}
                    <div className="card shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div style={{ width: '56px', height: '56px', background: 'var(--primary-light)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={28} className="text-primary" />
                            </div>
                            <div>
                                <h4 className="m-0">Landlord/Agent</h4>
                                {property.landlordVerified && (
                                    <span className="flex items-center gap-1 text-[10px] fw-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1">
                                        <ShieldCheck size={10} /> ID & LOCATION VERIFIED
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleChat}
                                className="btn btn-secondary w-full flex items-center justify-center gap-2 py-3"
                            >
                                <MessageSquare size={18} /> Chat with Landlord
                            </button>
                            <p className="text-xs text-light text-center m-0">
                                Response time: usually under 2 hours
                            </p>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default PropertyDetail;
