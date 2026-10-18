"use client";

import { useEffect } from "react";
import {
    MapContainer,
    Marker,
    TileLayer,
    useMap,
    useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ProductMapProps {
    latitude: number | null;
    longitude: number | null;
    onLocationChange: (latitude: number, longitude: number) => void;
}

const DEFAULT_POSITION: [number, number] = [23.8103, 90.4125];

const markerIcon = L.icon({
    iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function MapClickHandler({
    onLocationChange,
}: {
    onLocationChange: (latitude: number, longitude: number) => void;
}) {
    useMapEvents({
        click(event) {
            onLocationChange(event.latlng.lat, event.latlng.lng);
        },
    });

    return null;
}

function MapViewController({
    latitude,
    longitude,
}: {
    latitude: number | null;
    longitude: number | null;
}) {
    const map = useMap();

    useEffect(() => {
        if (latitude === null || longitude === null) {
            return;
        }

        map.setView(
            [latitude, longitude],
            Math.max(map.getZoom(), 15),
            { animate: true },
        );
    }, [latitude, longitude, map]);

    return null;
}

export default function ProductMap({
    latitude,
    longitude,
    onLocationChange,
}: ProductMapProps) {
    const hasCoordinates =
        latitude !== null && longitude !== null;

    const position: [number, number] = hasCoordinates
        ? [latitude, longitude]
        : DEFAULT_POSITION;

    return (
        <div className="w-full overflow-hidden rounded-xl">
            <MapContainer
                center={DEFAULT_POSITION}
                zoom={7}
                scrollWheelZoom
                style={{
                    height: "350px",
                    width: "100%",
                    zIndex: 0,
                }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapViewController
                    latitude={latitude}
                    longitude={longitude}
                />

                <MapClickHandler
                    onLocationChange={onLocationChange}
                />

                <Marker
                    position={position}
                    icon={markerIcon}
                    draggable
                    eventHandlers={{
                        dragend(event) {
                            const marker = event.target as L.Marker;
                            const coordinates = marker.getLatLng();

                            onLocationChange(
                                coordinates.lat,
                                coordinates.lng,
                            );
                        },
                    }}
                />
            </MapContainer>
        </div>
    );
}