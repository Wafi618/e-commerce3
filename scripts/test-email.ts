
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

async function main() {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.error("❌ Missing Gmail credentials in .env");
        return;
    }

    console.log("📧 Sending test email from:", process.env.GMAIL_USER);

    try {
        const info = await transporter.sendMail({
            from: `"Ecommerce Test" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER, // Send to self
            subject: "Test Email from Ecommerce Store",
            text: "If you see this, your Gmail SMTP integration is working correctly! ✅",
            html: "<b>If you see this, your Gmail SMTP integration is working correctly! ✅</b>",
        });

        console.log("✅ Message sent: %s", info.messageId);
        console.log("Check your inbox at: " + process.env.GMAIL_USER);
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
}

main().catch(console.error);
