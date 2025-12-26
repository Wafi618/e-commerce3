import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { MapPin, Navigation } from 'lucide-react';

const containerStyle = {
    width: '100%',
    height: '350px'
};

const defaultCenter = {
    lat: 23.8103, // Dhaka
    lng: 90.4125
};

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

interface LocationPickerProps {
    initialLat?: number;
    initialLng?: number;
    onLocationSelect: (lat: number, lng: number, address: string) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ initialLat, initialLng, onLocationSelect }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: libraries
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [center, setCenter] = useState(defaultCenter);
    const [markerPos, setMarkerPos] = useState(defaultCenter);
    const [searchResult, setSearchResult] = useState<google.maps.places.PlaceResult | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize with props if available
    useEffect(() => {
        if (initialLat && initialLng) {
            const pos = { lat: initialLat, lng: initialLng };
            setCenter(pos);
            setMarkerPos(pos);
        }
    }, [initialLat, initialLng]);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    const onMarkerDragEnd = useCallback(async (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setMarkerPos({ lat, lng });

            // Reverse Geocode
            try {
                const geocoder = new google.maps.Geocoder();
                const response = await geocoder.geocode({ location: { lat, lng } });
                if (response.results[0]) {
                    const address = response.results[0].formatted_address;
                    onLocationSelect(lat, lng, address);
                    if (inputRef.current) {
                        inputRef.current.value = address;
                    }
                } else {
                    onLocationSelect(lat, lng, "");
                }
            } catch (error) {
                console.error("Geocoding failed", error);
                onLocationSelect(lat, lng, "");
            }
        }
    }, [onLocationSelect]);

    const onPlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setCenter({ lat, lng });
                setMarkerPos({ lat, lng });
                onLocationSelect(lat, lng, place.formatted_address || place.name || "");
            }
        }
    };

    const handleCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude: lat, longitude: lng } = position.coords;
                    setCenter({ lat, lng });
                    setMarkerPos({ lat, lng });

                    // Geocode
                    try {
                        const geocoder = new google.maps.Geocoder();
                        const response = await geocoder.geocode({ location: { lat, lng } });
                        if (response.results[0]) {
                            onLocationSelect(lat, lng, response.results[0].formatted_address);
                        }
                    } catch (e) {
                        onLocationSelect(lat, lng, "");
                    }
                },
                () => {
                    alert("Could not get your location.");
                }
            );
        }
    };

    // Auto-detect location on mount if no initial props
    useEffect(() => {
        if (!initialLat && !initialLng && navigator.geolocation) {
            handleCurrentLocation();
        }
    }, [initialLat, initialLng]);

    if (!isLoaded) return <div className="h-[350px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">Loading Maps...</div>;

    return (
        <div className="w-full">
            <div className="mb-3 relative">
                <Autocomplete
                    onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                    onPlaceChanged={onPlaceChanged}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search or type your address location..."
                        className="w-full p-2 pl-10 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                </Autocomplete>
                <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>

            <div className="relative rounded-lg overflow-hidden border shadow-sm">
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={15}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={{
                        streetViewControl: true,
                        mapTypeControl: true,
                        fullscreenControl: true,
                    }}
                >
                    <Marker
                        position={markerPos}
                        draggable={true}
                        onDragEnd={onMarkerDragEnd}
                        animation={google.maps.Animation.DROP}
                    />
                </GoogleMap>

                <button
                    onClick={handleCurrentLocation}
                    className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 active:bg-blue-50 text-blue-600"
                    type="button"
                    title="Use My Current Location"
                >
                    <Navigation className="w-6 h-6" />
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                * Drag the marker to pinpoint your exact location for precise shipping.
            </p>
        </div>
    );
};

export default React.memo(LocationPicker);
