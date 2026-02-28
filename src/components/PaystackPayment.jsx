import React from 'react';
import { usePaystackPayment } from 'react-paystack';
import { PAYSTACK_PUBLIC_KEY } from '../services/paystack';

const PaystackPayment = ({ amount, email, metadata, onSuccess, onClose, btnText = "Pay and Book" }) => {
    // Paystack expects amount in Kobo (NGN * 100)
    const config = {
        reference: `PAY_${new Date().getTime()}`,
        email: email,
        amount: amount * 100, // Convert NGN to Kobo
        publicKey: PAYSTACK_PUBLIC_KEY,
        metadata: metadata
    };

    const initializePayment = usePaystackPayment(config);

    const handleOnSuccess = (reference) => {
        // This is called after the payment is successful
        if (onSuccess) {
            onSuccess(reference);
        }
    };

    const handleOnClose = () => {
        // This is called when the payment dialog is closed
        if (onClose) {
            onClose();
        }
    };

    return (
        <button
            className="btn btn-primary w-full"
            onClick={() => {
                initializePayment(handleOnSuccess, handleOnClose);
            }}
        >
            {btnText}
        </button>
    );
};

export default PaystackPayment;
