import {
    Html,
    Head,
    Preview,
    Body,
    Container,
    Section,
    Text,
    Heading,
    Hr,
    Row,
    Column,
} from "@react-email/components";
import * as React from "react";

interface AdminNotificationProps {
    orderId: string;
    customerName: string;
    email: string;
    phone: string;
    items: any[];
    total: number;
    address: string;
    city: string;
    country: string;
    paymentMethod: string;
}

export const AdminNotificationWrapper = ({
    orderId = "12345",
    customerName = "John Doe",
    email = "john@example.com",
    phone = "01700000000",
    items = [],
    total = 0,
    address = "123 Street",
    city = "Dhaka",
    country = "Bangladesh",
    paymentMethod = "COD",
}: AdminNotificationProps) => (
    <Html>
        <Head />
        <Preview>New Order #{orderId} Received!</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>New Order Received! 🚀</Heading>
                <Text style={text}>
                    A new order has been placed by <strong>{customerName}</strong>.
                </Text>

                <Section style={orderBox}>
                    <Text style={orderIdText}>Order #{orderId}</Text>
                    <Hr style={hr} />
                    {items.map((item, index) => (
                        <Row key={index} style={itemRow}>
                            <Column>
                                <Text style={itemName}>
                                    {item.name} x {item.quantity}
                                </Text>
                                {item.selectedOptions && Object.entries(item.selectedOptions).map(([key, value]) => (
                                    <Text key={key} style={itemOption}>{key}: {String(value)}</Text>
                                ))}
                            </Column>
                            <Column style={{ textAlign: "right" }}>
                                <Text style={itemPrice}>৳{Number(item.price).toFixed(2)}</Text>
                            </Column>
                        </Row>
                    ))}
                    <Hr style={hr} />
                    <Row>
                        <Column>
                            <Text style={totalLabel}>Total</Text>
                        </Column>
                        <Column style={{ textAlign: "right" }}>
                            <Text style={totalPrice}>৳{Number(total).toFixed(2)}</Text>
                        </Column>
                    </Row>
                </Section>

                <Section style={customerBox}>
                    <Heading as="h3" style={h3}>Customer Details</Heading>
                    <Text style={text}><strong>Name:</strong> {customerName}</Text>
                    <Text style={text}><strong>Email:</strong> {email}</Text>
                    <Text style={text}><strong>Phone:</strong> {phone || 'N/A'}</Text>
                    <Text style={text}>
                        <strong>Address:</strong><br />
                        {address}<br />
                        {city}, {country}
                    </Text>
                    <Text style={text}>
                        <strong>Payment Method:</strong> {paymentMethod}
                    </Text>
                </Section>
            </Container>
        </Body>
    </Html>
);

export default AdminNotificationWrapper;

const main = {
    backgroundColor: "#ffffff",
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: "0 auto",
    padding: "20px 0 48px",
    maxWidth: "560px",
};

const h1 = {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#16a34a", // Green for growth/money
    margin: "40px 0",
};

const h3 = {
    fontSize: "16px",
    fontWeight: "bold",
    margin: "0 0 10px",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px",
};

const text = {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#333",
    margin: "10px 0",
};

const orderBox = {
    background: "#f0fdf4", // Light green background
    border: "1px solid #bbf7d0",
    padding: "24px",
    borderRadius: "8px",
    margin: "24px 0",
};

const customerBox = {
    background: "#f9fafb",
    padding: "20px",
    borderRadius: "8px",
    margin: "20px 0",
};

const orderIdText = {
    fontSize: "18px",
    fontWeight: "bold",
    margin: "0 0 16px",
};

const itemRow = {
    padding: "12px 0",
    borderBottom: "1px solid #e5e7eb",
};

const itemName = {
    fontSize: "14px",
    fontWeight: "500",
    margin: "0",
};

const itemOption = {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0",
};

const itemPrice = {
    fontSize: "14px",
    margin: "0",
};

const totalLabel = {
    fontSize: "16px",
    fontWeight: "bold",
    margin: "0",
};

const totalPrice = {
    fontSize: "16px",
    fontWeight: "bold",
    margin: "0",
};

const hr = {
    borderColor: "#e5e7eb",
    margin: "20px 0",
};
