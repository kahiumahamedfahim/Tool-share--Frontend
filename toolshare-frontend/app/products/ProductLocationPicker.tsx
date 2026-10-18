"use client";



import {

    useCallback,

    useEffect,

    useRef,

    useState,

} from "react";

import dynamic from "next/dynamic";



const ProductMap = dynamic(() => import("./ProductMap"), {

    ssr: false,

    loading: () => (

        <div className="flex h-[350px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500">

            Loading map...

        </div>

    ),

});



export interface ProductLocationData {

    latitude: number | null;

    longitude: number | null;

    division: string;

    district: string;

    upazila: string;

    pickupAddress: string;

}



interface ProductLocationPickerProps {

    value: ProductLocationData;

    onChange: (location: ProductLocationData) => void;

    onConfirmationChange?: (confirmed: boolean) => void;

}



interface ReverseGeocodeResult {

    display_name?: string;

    address?: {

        state?: string;

        state_district?: string;

        county?: string;

        city?: string;

        town?: string;

        village?: string;

        municipality?: string;

        suburb?: string;

        city_district?: string;

        neighbourhood?: string;

    };

}



const EMPTY_LOCATION: ProductLocationData = {

    latitude: null,

    longitude: null,

    division: "",

    district: "",

    upazila: "",

    pickupAddress: "",

};



export default function ProductLocationPicker({

    value,

    onChange,

    onConfirmationChange,

}: ProductLocationPickerProps) {

    const [draft, setDraft] = useState<ProductLocationData>(

        () => ({ ...EMPTY_LOCATION, ...value }),

    );



    const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(

        null,

    );

    const [isGettingLocation, setIsGettingLocation] = useState(false);

    const [isLookingUpAddress, setIsLookingUpAddress] = useState(false);

    const [error, setError] = useState("");

    const [notice, setNotice] = useState("");

    const [isConfirmed, setIsConfirmed] = useState(false);



    const lookupController = useRef<AbortController | null>(null);

    const requestId = useRef(0);

    const addressWasEdited = useRef(false);



    const invalidateConfirmation = useCallback(() => {

        setIsConfirmed(false);

        onConfirmationChange?.(false);

    }, [onConfirmationChange]);



    // Keep the local draft synchronized with parent resets or updates.

    useEffect(() => {

        setDraft({ ...EMPTY_LOCATION, ...value });

    }, [

        value.latitude,

        value.longitude,

        value.division,

        value.district,

        value.upazila,

        value.pickupAddress,

    ]);



    useEffect(() => {

        return () => {

            lookupController.current?.abort();

        };

    }, []);



    const reverseGeocode = useCallback(

        async (latitude: number, longitude: number) => {

            lookupController.current?.abort();



            const controller = new AbortController();

            lookupController.current = controller;



            const thisRequest = ++requestId.current;



            setIsLookingUpAddress(true);

            setError("");



            try {

                const params = new URLSearchParams({

                    format: "jsonv2",

                    lat: String(latitude),

                    lon: String(longitude),

                    addressdetails: "1",

                    "accept-language": "en",

                });



                const response = await fetch(

                    `https\://nominatim.openstreetmap.org/reverse?${params.toString()}`,

                    { signal: controller.signal },

                );



                if (!response.ok) {

                    throw new Error("Address lookup failed.");

                }



                const result =

                    (await response.json()) as ReverseGeocodeResult;



                if (

                    controller.signal.aborted ||

                    thisRequest !== requestId.current

                ) {

                    return;

                }



                // Do not replace text while the owner is editing it.

                if (!addressWasEdited.current) {

                    const address = result.address ?? {};



                    setDraft((previous) => ({

                        ...previous,

                        division:

                            address.state ?? previous.division,

                        district:

                            address.state_district ??

                            address.county ??

                            previous.district,

                        upazila:

                            address.municipality ??

                            address.city_district ??

                            address.suburb ??

                            address.town ??

                            address.village ??

                            previous.upazila,

                        pickupAddress:

                            result.display_name ??

                            previous.pickupAddress,

                    }));

                }



                setNotice(

                    "Address suggestion received. Verify the address and actual pickup point before confirming.",

                );

            } catch (lookupError) {

                if (

                    lookupError instanceof Error &&

                    lookupError.name === "AbortError"

                ) {

                    return;

                }



                setNotice(

                    "Coordinates are selected, but the address could not be detected. Please enter the address manually.",

                );

            } finally {

                if (thisRequest === requestId.current) {

                    setIsLookingUpAddress(false);

                }

            }

        },

        [],

    );



    const updateCoordinates = useCallback(

        (

            latitude: number,

            longitude: number,

            accuracy?: number,

        ) => {

            addressWasEdited.current = false;



            invalidateConfirmation();

            setError("");

            setNotice("");

            setGpsAccuracy(accuracy ?? null);



            setDraft((previous) => ({

                ...previous,

                latitude,

                longitude,

            }));



            void reverseGeocode(latitude, longitude);

        },

        [invalidateConfirmation, reverseGeocode],

    );



    const useCurrentLocation = () => {

        setError("");

        setNotice("");



        if (!navigator.geolocation) {

            setError(

                "Your browser does not support GPS detection. Select the pickup point on the map instead.",

            );

            return;

        }



        setIsGettingLocation(true);



        navigator.geolocation.getCurrentPosition(

            (position) => {

                setIsGettingLocation(false);



                updateCoordinates(

                    position.coords.latitude,

                    position.coords.longitude,

                    position.coords.accuracy,

                );



                setNotice(

                    "GPS detected. Verify that this is where the product is physically kept.",

                );

            },

            (geoError) => {

                setIsGettingLocation(false);



                if (geoError.code === geoError.PERMISSION_DENIED) {

                    setError(

                        "Location permission was denied. Allow location access in your browser or select the pickup point manually.",

                    );

                } else if (

                    geoError.code === geoError.POSITION_UNAVAILABLE

                ) {

                    setError(

                        "Your current location is unavailable. Try again or select the pickup point manually.",

                    );

                } else {

                    setError(

                        "GPS detection timed out. Try again or select the pickup point manually.",

                    );

                }

            },

            {

                enableHighAccuracy: true,

                timeout: 15000,

                maximumAge: 0,

            },

        );

    };



    const updateAddressField = (

        field:

            | "division"

            | "district"

            | "upazila"

            | "pickupAddress",

        fieldValue: string,

    ) => {

        addressWasEdited.current = true;



        invalidateConfirmation();

        setError("");

        setNotice("");



        setDraft((previous) => ({

            ...previous,

            [field]: fieldValue,

        }));

    };



    const confirmLocation = () => {

        setError("");



        if (draft.latitude === null || draft.longitude === null) {

            setError(

                "Detect your location or select a point on the map first.",

            );

            return;

        }



        if (

            !draft.division.trim() ||

            !draft.district.trim() ||

            !draft.upazila.trim() ||

            !draft.pickupAddress.trim()

        ) {

            setError(

                "Complete all address fields before confirming the pickup location.",

            );

            return;

        }



        const confirmedLocation: ProductLocationData = {

            ...draft,

            division: draft.division.trim(),

            district: draft.district.trim(),

            upazila: draft.upazila.trim(),

            pickupAddress: draft.pickupAddress.trim(),

        };



        // The parent receives the location only after confirmation.

        onChange(confirmedLocation);

        setDraft(confirmedLocation);

        setIsConfirmed(true);

        onConfirmationChange?.(true);



        setNotice("Pickup location confirmed for this product form.");

    };



    
return (
    <section className="w-full min-w-0 space-y-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {/* Header */}
        <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">
                Product pickup location
            </h2>

            <p className="text-sm leading-6 text-slate-600">
                Select where the product is physically kept. Your current
                GPS location is only a starting point; it may differ from
                the product&apos;s actual pickup location.
            </p>
        </div>

        {/* GPS button */}
        <button
            type="button"
            onClick={useCurrentLocation}
            disabled={isGettingLocation}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {isGettingLocation
                ? "Detecting your location..."
                : "Use my current GPS location"}
        </button>

        {/* Map */}
        <div className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200">
            <ProductMap
                latitude={draft.latitude}
                longitude={draft.longitude}
                onLocationChange={(latitude, longitude) =>
                    updateCoordinates(latitude, longitude)
                }
            />
        </div>

        <p className="w-full text-sm leading-6 text-slate-600">
            Click the map or drag the marker to the place where the renter
            or assigned rider can collect the product.
        </p>

        {/* Selected coordinates */}
        {draft.latitude !== null && draft.longitude !== null && (
            <div className="w-full space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">
                    Selected coordinates
                </p>

                <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <p>
                        Latitude: {draft.latitude.toFixed(6)}
                    </p>
                    <p>
                        Longitude: {draft.longitude.toFixed(6)}
                    </p>
                </div>

                {gpsAccuracy !== null && (
                    <p className="text-sm leading-6 text-slate-600">
                        GPS accuracy: approximately {Math.round(gpsAccuracy)} metres.
                        {gpsAccuracy > 100
                            ? " This reading is relatively imprecise; try again outdoors or adjust the marker manually."
                            : ""}
                    </p>
                )}

                {gpsAccuracy === null && (
                    <p className="text-sm leading-6 text-slate-500">
                        These coordinates may have been selected manually.
                        GPS accuracy is not available for this selection.
                    </p>
                )}
            </div>
        )}

        {isLookingUpAddress && (
            <p className="text-sm text-blue-700" role="status">
                Looking up the address for these coordinates...
            </p>
        )}

        {/* Address fields */}
        <div className="grid w-full min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
                <label
                    htmlFor="pickup-division"
                    className="block text-sm font-medium text-slate-700"
                >
                    Division <span className="text-red-600">*</span>
                </label>

                <input
                    id="pickup-division"
                    value={draft.division}
                    onChange={(event) =>
                        updateAddressField("division", event.target.value)
                    }
                    placeholder="e.g. Dhaka Division"
                    autoComplete="address-level1"
                    required
                    className="block w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
            </div>

            <div className="min-w-0 space-y-2">
                <label
                    htmlFor="pickup-district"
                    className="block text-sm font-medium text-slate-700"
                >
                    District <span className="text-red-600">*</span>
                </label>

                <input
                    id="pickup-district"
                    value={draft.district}
                    onChange={(event) =>
                        updateAddressField("district", event.target.value)
                    }
                    placeholder="e.g. Dhaka District"
                    autoComplete="address-level2"
                    required
                    className="block w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
            </div>

            <div className="min-w-0 space-y-2">
                <label
                    htmlFor="pickup-upazila"
                    className="block text-sm font-medium text-slate-700"
                >
                    Upazila / Area <span className="text-red-600">*</span>
                </label>

                <input
                    id="pickup-upazila"
                    value={draft.upazila}
                    onChange={(event) =>
                        updateAddressField("upazila", event.target.value)
                    }
                    placeholder="e.g. Khilkhet"
                    required
                    className="block w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
            </div>

            <div className="min-w-0 space-y-2">
                <label
                    htmlFor="pickup-address"
                    className="block text-sm font-medium text-slate-700"
                >
                    Exact pickup address <span className="text-red-600">*</span>
                </label>

                <textarea
                    id="pickup-address"
                    value={draft.pickupAddress}
                    onChange={(event) =>
                        updateAddressField("pickupAddress", event.target.value)
                    }
                    placeholder="House, road, building, and a recognizable landmark"
                    rows={3}
                    autoComplete="street-address"
                    required
                    className="block w-full min-w-0 resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
            </div>
        </div>

        {/* Helper text */}
        <p className="w-full text-sm leading-6 text-slate-500">
            Automatically detected addresses can be approximate. Check the
            map and correct the address. Only confirm a location where the
            product can actually be collected.
        </p>

        {/* Error */}
        {error && (
            <div
                role="alert"
                className="w-full rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
            >
                {error}
            </div>
        )}

        {/* Notice */}
        {notice && (
            <div
                role="status"
                className={`w-full rounded-xl border p-4 text-sm leading-6 ${
                    isConfirmed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-blue-200 bg-blue-50 text-blue-800"
                }`}
            >
                {notice}
            </div>
        )}

        {/* Confirm button */}
        <button
            type="button"
            onClick={confirmLocation}
            disabled={isGettingLocation || isLookingUpAddress}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {isConfirmed
                ? "Pickup location confirmed ✓"
                : "Confirm pickup location"}
        </button>
    </section>
);


}