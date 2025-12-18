
require('dotenv').config();
const { sendOrderConfirmationEmail, sendAdminOrderReceivedEmail } = require('../lib/services/emailService');

// Mock Data
const mockOrder = {
    customerName: 'Test User',
    email: process.env.GMAIL_USER, // Send to self for testing
    phone: '01700000000',
    city: 'Dhaka',
    country: 'Bangladesh',
    address: '123 Test St',
    paymentMethod: 'TEST_PAYMENT',
    total: 1550,
    items: [
        {
            name: 'Premium T-Shirt',
            quantity: 2,
            price: 500,
            selectedOptions: { Color: 'Black', Size: 'L' }
        },
        {
            name: 'Denim Jeans',
            quantity: 1,
            price: 550,
            selectedOptions: { Waist: '32', Length: '30' }
        }
    ]
};

const orderId = 'TEST-' + Date.now();

async function main() {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.error("❌ Missing Gmail credentials in .env");
        return;
    }

    console.log("📧 Sending TEST Customer Confirmation...");
    await sendOrderConfirmationEmail(process.env.GMAIL_USER, orderId, mockOrder);

    console.log("📧 Sending TEST Admin Notification...");
    await sendAdminOrderReceivedEmail(orderId, mockOrder);

    console.log("✅ Test emails sent! Check your inbox (and CEO inboxes if verified/testing).");
}

main().catch(console.error);
