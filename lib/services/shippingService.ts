

interface ShippingRate {
    distance: number; // in km
    cost: number;
}

// Configuration
const SHOP_LOCATION = {
    lat: 23.7963, // Rupayan Nowfa Plaza, Kachukhet
    lng: 90.3929
};

const BASE_SHIPPING_COST = 50; // Base cost in Taka
const COST_PER_KM = 1.1; // Additional cost per KM (Derived from 450tk / 410km)
const MAX_SHIPPING_COST = 500; // Cap at 500 Taka
const DEFAULT_FLAT_RATE = 100; // Fallback if calculation fails

export const calculateShippingCost = async (destAddress: string, lat?: number, lng?: number): Promise<number> => {
    // 1. Check if API Key is available
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.warn("Shipping: No Google Maps API Key found, using fallback flat rate.");
        return DEFAULT_FLAT_RATE;
    }

    try {
        // 2. We can't use the Distance Matrix Service directly on server-side easily without a library like @google/maps
        // Use client-side fetch to a Next.js API route proxy OR use simple fetch if allowed (but CORS might block from client directly if not configured)
        // Best approach for client-side context: Use the Javascript API if loaded, or fetch a backend endpoint.

        // Let's assume we call a backend API that handles the key protection and secret specific logic.
        // But for "User will add key later", let's build a client-side utility that tries to fetch direction if the script is loaded?
        // Or simpler: Fetch our own API endpoint which calls Google.

        // Simpler Implementation for "Key Later":
        // Just return default for now until correct setup is widespread.
        // But the plan says "Create service to call Google Distance Matrix API".

        // Let's create a proxy endpoint structure.
        let url = `/api/shipping/calculate?address=${encodeURIComponent(destAddress)}`;
        if (lat && lng) {
            url += `&lat=${lat}&lng=${lng}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.distance) {
            const rawCost = BASE_SHIPPING_COST + (data.distance * COST_PER_KM);
            // Ceiling to nearest 5 multiple
            const ceiledCost = Math.ceil(rawCost / 5) * 5;
            const finalCost = Math.max(ceiledCost, BASE_SHIPPING_COST); // Ensure at least base
            return Math.min(finalCost, MAX_SHIPPING_COST); // Cap at max
        }

        return DEFAULT_FLAT_RATE;

    } catch (error) {
        console.error("Shipping Calculation Failed:", error);
        return DEFAULT_FLAT_RATE;
    }
}
