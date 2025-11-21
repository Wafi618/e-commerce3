import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { User as PrismaUser } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextApiRequest, NextApiResponse } from 'next';

export const getAuthOptions = (req: NextApiRequest, res: NextApiResponse): NextAuthOptions => {
    // Determine session maxAge based on cookies
    let maxAge = 8 * 60 * 60; // Default: 8 hours

    if (req.cookies['auth-method'] === 'one-tap') {
        maxAge = 24 * 60 * 60; // One Tap: 24 hours
    } else if (req.cookies['remember-me'] === 'true') {
        maxAge = 10 * 365 * 24 * 60 * 60; // Stay signed in: 10 years (Indefinite)
    }

    return {
        adapter: PrismaAdapter(prisma),
        providers: [
            GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID || '',
                clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
                authorization: {
                    params: {
                        prompt: "consent",
                        access_type: "offline",
                        response_type: "code"
                    }
                },
                allowDangerousEmailAccountLinking: true
            }),
            CredentialsProvider({
                name: 'Credentials',
                credentials: {
                    email: { label: "Email", type: "email" },
                    password: { label: "Password", type: "password" },
                    googleIdToken: { label: "Google ID Token", type: "text" }
                },
                async authorize(credentials) {
                    // 1. Handle Google One Tap (ID Token)
                    if (credentials?.googleIdToken) {
                        try {
                            const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credentials.googleIdToken}`);
                            const data = await response.json();

                            if (!response.ok || !data.email) {
                                throw new Error('Invalid Google Token');
                            }

                            // Check if user exists
                            let user = await prisma.user.findUnique({
                                where: { email: data.email }
                            });

                            // If user doesn't exist, create them (Auto-signup)
                            if (!user) {
                                user = await prisma.user.create({
                                    data: {
                                        email: data.email,
                                        name: data.name,
                                        image: data.picture,
                                        role: 'CUSTOMER', // Default role
                                        restrictedAccess: true, // Default to restricted until phone verification
                                    }
                                });
                            } else {
                                // If user exists but has no image, update it
                                if (!user.image && data.picture) {
                                    await prisma.user.update({
                                        where: { id: user.id },
                                        data: { image: data.picture } as any
                                    });
                                }
                            }

                            // Return user object (same structure as password login)
                            return {
                                id: user.id,
                                email: user.email,
                                name: user.name,
                                role: user.role,
                                phone: user.phone,
                                restrictedAccess: user.restrictedAccess,
                                image: (user as any).image,
                            };

                        } catch (error) {
                            console.error('Google One Tap Error:', error);
                            return null;
                        }
                    }

                    // 2. Handle Email/Password Login
                    if (!credentials?.email || !credentials?.password) {
                        return null;
                    }

                    const user: PrismaUser | null = await prisma.user.findUnique({
                        where: { email: credentials.email }
                    });

                    if (!user) {
                        return null;
                    }

                    if (!user.password) {
                        throw new Error("Account exists. Please sign in with Google.");
                    }

                    const isValid = await bcrypt.compare(credentials.password, user.password);

                    if (!isValid) {
                        return null;
                    }

                    // Check if user has phone or PIN for password reset
                    const hasPhoneOrPin = !!(user.phone || user.resetPin);
                    const restrictedAccess = !hasPhoneOrPin;

                    // Update restricted access status if it changed
                    if (user.restrictedAccess !== restrictedAccess) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { restrictedAccess },
                        });
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        phone: user.phone,
                        restrictedAccess: restrictedAccess,
                        image: (user as any).image,
                    };
                }
            })
        ],
        session: {
            strategy: 'jwt',
            maxAge: maxAge,
        },
        callbacks: {
            async jwt({ token, user, trigger, session }) {
                if (user) {
                    token.id = user.id;
                    token.role = user.role;
                    token.phone = user.phone;
                    token.restrictedAccess = user.restrictedAccess;
                }

                // If session update is triggered, update token with new session data
                if (trigger === "update" && session) {
                    return { ...token, ...session.user };
                }

                // Always fetch fresh data from DB to ensure session is up-to-date
                if (token.sub) {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.sub },
                        select: {
                            name: true,
                            phone: true,
                            role: true,
                            restrictedAccess: true,
                            city: true,
                            country: true,
                            address: true,
                            house: true,
                            floor: true,
                            darkMode: true,
                            image: true
                        }
                    });

                    if (dbUser) {
                        token.name = dbUser.name;
                        token.phone = dbUser.phone;
                        token.role = dbUser.role;
                        token.restrictedAccess = dbUser.restrictedAccess;
                        token.city = dbUser.city;
                        token.country = dbUser.country;
                        token.address = dbUser.address;
                        token.house = dbUser.house;
                        token.floor = dbUser.floor;
                        token.darkMode = dbUser.darkMode;
                        if (dbUser.image) token.picture = dbUser.image;
                    }
                }
                return token;
            },
            async session({ session, token }) {
                if (session.user) {
                    session.user.id = token.id;
                    session.user.role = token.role;
                    session.user.phone = token.phone;
                    session.user.restrictedAccess = token.restrictedAccess;
                    session.user.city = token.city as string;
                    session.user.country = token.country as string;
                    session.user.address = token.address as string;
                    session.user.house = token.house as string;
                    session.user.floor = token.floor as string;
                    session.user.darkMode = token.darkMode as boolean;
                }
                return session;
            },
            async signIn({ user, account }) {
                if (account?.provider === 'google') {
                    // Check if user exists
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email! },
                    });

                    if (existingUser) {
                        // If user exists but has no image, update it
                        if (!existingUser.image && user.image) {
                            await prisma.user.update({
                                where: { id: existingUser.id },
                                data: { image: user.image } as any,
                            });
                        }
                        return true;
                    }

                    // New user will be created by Adapter automatically.
                    return true;
                }
                return true;
            }
        },
        secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
        // @ts-ignore - trustHost is a valid option in NextAuth v4 but types might be outdated
        trustHost: true,
        pages: {
            error: '/auth/error',
        },
    };
};

export default (req: NextApiRequest, res: NextApiResponse) => {
    return NextAuth(req, res, getAuthOptions(req, res));
};

