import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { addressSchema } from '@/lib/schemas';
import { requireUser } from '@/lib/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Verify Token
    const user = await requireUser(req, res);
    if (!user) return;

    const userId = user.userId;

    try {
        if (req.method === 'GET') {
            const addresses = await prisma.address.findMany({
                where: { userId },
                orderBy: { isDefault: 'desc' }, // Default first
            });
            return res.status(200).json({ success: true, data: addresses });
        }

        if (req.method === 'POST') {
            const result = addressSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ success: false, error: result.error.issues[0].message });
            }

            const { label, phone, city, country, address, house, floor, isDefault } = result.data;

            // If setting as default, unset others
            if (isDefault) {
                await prisma.address.updateMany({
                    where: { userId },
                    data: { isDefault: false },
                });
            }

            const newAddress = await prisma.address.create({
                data: {
                    userId,
                    label,
                    phone,
                    city,
                    country,
                    address,
                    house,
                    floor,
                    isDefault: isDefault || false,
                },
            });

            return res.status(201).json({ success: true, data: newAddress });
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id || typeof id !== 'string') {
                return res.status(400).json({ success: false, error: 'Address ID required' });
            }

            // Verify ownership
            const existing = await prisma.address.findUnique({ where: { id } });
            if (!existing || existing.userId !== userId) {
                return res.status(404).json({ success: false, error: 'Address not found' });
            }

            await prisma.address.delete({ where: { id } });
            return res.status(200).json({ success: true, message: 'Address deleted' });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Address API Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
