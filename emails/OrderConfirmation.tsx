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

interface OrderConfirmationProps {
    orderId: string;
    customerName: string;
    items: any[];
    total: number;
    address: string;
    city: string;
    country: string;
    paymentMethod: string;
}

export const OrderConfirmationWrapper = ({
    orderId = "12345",
    customerName = "Valued Customer",
    items = [],
    total = 0,
    address = "123 Street",
    city = "Dhaka",
    country = "Bangladesh",
    paymentMethod = "COD",
}: OrderConfirmationProps) => (
    <Html>
        <Head />
        <Preview>Order Confirmation #{orderId}</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>Order Confirmation</Heading>
                <Text style={text}>Hi {customerName},</Text>
                <Text style={text}>
                    Thank you for your order! We have received it and are processing it now.
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

                <Section>
                    <Heading as="h3" style={h3}>Shipping Details</Heading>
                    <Text style={text}>
                        {address}<br />
                        {city}, {country}
                    </Text>
                    <Text style={text}>
                        <strong>Payment Method:</strong> {paymentMethod}
                    </Text>
                </Section>

                <Hr style={hr} />
                <Text style={footer}>
                    If you have any questions, please reply to this email.
                </Text>
            </Container>
        </Body>
    </Html>
);

export default OrderConfirmationWrapper;

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
    color: "#2563eb",
    margin: "40px 0",
};

const h3 = {
    fontSize: "18px",
    fontWeight: "bold",
    margin: "20px 0 10px",
};

const text = {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#333",
};

const orderBox = {
    background: "#f9fafb",
    padding: "24px",
    borderRadius: "8px",
    margin: "24px 0",
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

const footer = {
    fontSize: "12px",
    color: "#6b7280",
};
