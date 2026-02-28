// src/services/paystack.js
// Paystack configuration and service helpers

export const PAYSTACK_PUBLIC_KEY = "pk_test_59695d8db587b0f552945d7458a3efa76bbbf0c8";
export const PAYSTACK_SECRET_KEY = "sk_test_54a74399564305b1f65317e50655b0f355a0f79f";

export const paystackConfig = {
    publicKey: PAYSTACK_PUBLIC_KEY,
    currency: "NGN",
    // In a real app, callback URL would be handled by the library or backend
};

export const paystackEscrow = {
    // Helper to format metadata for Paystack
    generateMetadata: (propertyId, studentId, landlordId) => {
        return {
            custom_fields: [
                { display_name: "Property ID", variable_name: "property_id", value: propertyId },
                { display_name: "Student ID", variable_name: "student_id", value: studentId },
                { display_name: "Landlord ID", variable_name: "landlord_id", value: landlordId }
            ]
        };
    }
};
