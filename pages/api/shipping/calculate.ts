import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { address, lat, lng } = req.query;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!address && (!lat || !lng)) {
        return res.status(400).json({ success: false, error: 'Address required' });
    }

    if (!apiKey) {
        return res.json({ success: false, distance: 0, note: 'No API Key' });
    }

    try {
        // Use Google Distance Matrix API
        // Origin: Rupayan Nowfa Plaza
        const origin = 'Rupayan Nowfa Plaza, 1103 Kachukhet Rd, Dhaka, Bangladesh';

        let destination = address as string;
        if (lat && lng) {
            destination = `${lat},${lng}`;
        }

        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

        const gRes = await fetch(url);
        const data = await gRes.json();

        if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
            // Distance in meters
            const distanceMeters = data.rows[0].elements[0].distance.value;
            const distanceKm = distanceMeters / 1000;

            return res.json({ success: true, distance: distanceKm });
        } else {
            return res.json({ success: false, error: 'Google API Error or Zero Results' });
        }

    } catch (error) {
        console.error("Shipping API Error:", error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}
