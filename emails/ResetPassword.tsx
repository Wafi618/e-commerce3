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
    Button,
} from "@react-email/components";
import * as React from "react";

interface ResetPasswordProps {
    resetLink: string;
    userName: string;
}

export const ResetPasswordWrapper = ({
    resetLink = "http://localhost:3000/auth/reset-password?token=12345",
    userName = "Valued Customer",
}: ResetPasswordProps) => (
    <Html>
        <Head />
        <Preview>Reset Your Password</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>Reset Password</Heading>
                <Text style={text}>Hi {userName},</Text>
                <Text style={text}>
                    We received a request to reset your password. If you didn't make this request, you can safely ignore this email.
                </Text>

                <Section style={buttonContainer}>
                    <Button style={button} href={resetLink}>
                        Reset Password
                    </Button>
                </Section>

                <Text style={text}>
                    Or copy and paste this link into your browser:
                    <br />
                    <a href={resetLink} style={link}>{resetLink}</a>
                </Text>

                <Hr style={hr} />
                <Text style={footer}>
                    This link will expire in 1 hour.
                </Text>
            </Container>
        </Body>
    </Html>
);

export default ResetPasswordWrapper;

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

const text = {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#333",
    marginBottom: "20px",
};

const buttonContainer = {
    textAlign: "center" as const,
    margin: "30px 0",
};

const button = {
    backgroundColor: "#2563eb",
    borderRadius: "5px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "12px 24px",
};

const link = {
    color: "#2563eb",
    textDecoration: "underline",
};

const hr = {
    borderColor: "#e5e7eb",
    margin: "20px 0",
};

const footer = {
    fontSize: "12px",
    color: "#6b7280",
};
