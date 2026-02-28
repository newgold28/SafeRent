import React from 'react';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import RoommateFinder from '../components/RoommateFinder';
import PaymentSafety from '../components/PaymentSafety';

const LandingPage = () => {
    return (
        <div>
            <Hero />
            <HowItWorks />
            <RoommateFinder />
            <PaymentSafety />
        </div>
    );
};

export default LandingPage;
