"use client";

import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
    getMyProfile,
    updateMyProfile,
    updateMyPassword,
    getMyDocument,
    uploadMyDocument,
    type UserInfo,
} from "@/app/lib/rental-api";

export default function UserProfilePage() {
    const [profile, setProfile] = useState<UserInfo | null>(null);
    const [document, setDocument] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Password change form
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordChanging, setPasswordChanging] = useState(false);

    // Profile update form
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [profileUpdating, setProfileUpdating] = useState(false);

    // Document upload
    const [selectedProfileImage, setSelectedProfileImage] = useState<File[]>([]);
    const [selectedNidFront, setSelectedNidFront] = useState<File[]>([]);
    const [selectedNidBack, setSelectedNidBack] = useState<File[]>([]);
    const [documentUploading, setDocumentUploading] = useState(false);

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError("");

            const profileData = await getMyProfile();
            setProfile(profileData);

            setFirstName(profileData.firstName);
            setLastName(profileData.lastName);
            setPhone(profileData.phone);
            setAddress(profileData.address || "");
            setLatitude(profileData.latitude || "");
            setLongitude(profileData.longitude || "");

            const docData = await getMyDocument();
            setDocument(docData);
        } catch (err: any) {
            console.error("Failed to load profile:", err);

            let message = "Unable to load profile.";

            if (isAxiosError(err)) {
                const backendMessage = err.response?.data?.message;
                message = Array.isArray(backendMessage)
                    ? backendMessage.join(", ")
                    : backendMessage || message;
            }

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    useEffect(() => {
        if (typeof L === "undefined") return;
        const map = L.map("profile-map").setView(
            [parseFloat(latitude || "23.8103"), parseFloat(longitude || "90.4125")],
            13
        );
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        var marker = L.marker([
            parseFloat(latitude || "23.8103"),
            parseFloat(longitude || "90.4125"),
        ]).addTo(map);
        map.on("click", function (e: any) {
            marker.setLatLng(e.latlng);
            const latInput = document.getElementById("latitude");
            const lngInput = document.getElementById("longitude");
            if (latInput) latInput.value = e.latlng.lat.toFixed(6);
            if (lngInput) lngInput.value = e.latlng.lng.toFixed(6);
            setLatitude(e.latlng.lat.toFixed(6));
            setLongitude(e.latlng.lng.toFixed(6));
        });
        return () => {
            map.remove();
        };
    }, [latitude, longitude]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setProfileUpdating(true);
            setError("");
            setSuccess("");

            await updateMyProfile({
                firstName,
                lastName,
                phone,
                address,
                latitude,
                longitude,
            });

            setSuccess("Profile updated successfully.");
            await loadProfile();
        } catch (err: any) {
            console.error("Failed to update profile:", err);

            let message = "Unable to update profile.";

            if (isAxiosError(err)) {
                const backendMessage = err.response?.data?.message;
                message = Array.isArray(backendMessage)
                    ? backendMessage.join(", ")
                    : backendMessage || message;
            }

            setError(message);
        } finally {
            setProfileUpdating(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setPasswordChanging(true);
            setError("");
            setSuccess("");

            await updateMyPassword({
                currentPassword,
                newPassword,
                confirmPassword,
            });

            setSuccess("Password changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            console.error("Failed to change password:", err);

            let message = "Unable to change password.";

            if (isAxiosError(err)) {
                const backendMessage = err.response?.data?.message;
                message = Array.isArray(backendMessage)
                    ? backendMessage.join(", ")
                    : backendMessage || message;
            }

            setError(message);
        } finally {
            setPasswordChanging(false);
        }
    };

    const handleUploadDocument = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setDocumentUploading(true);
            setError("");
            setSuccess("");

            const formData = new FormData();

            selectedProfileImage.forEach((f) =>
                formData.append("profileImage", f),
            );
            selectedNidFront.forEach((f) =>
                formData.append("nidFrontImage", f),
            );
            selectedNidBack.forEach((f) =>
                formData.append("nidBackImage", f),
            );

            await uploadMyDocument(formData);

            setSuccess("Documents uploaded successfully.");
            setSelectedProfileImage([]);
            setSelectedNidFront([]);
            setSelectedNidBack([]);
            await loadProfile();
        } catch (err: any) {
            console.error("Failed to upload document:", err);

            let message = "Unable to upload documents.";

            if (isAxiosError(err)) {
                const backendMessage = err.response?.data?.message;
                message = Array.isArray(backendMessage)
                    ? backendMessage.join(", ")
                    : backendMessage || message;
            }

            setError(message);
        } finally {
            setDocumentUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 p-4">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-zinc-900 sm:text-4xl mb-8">
                    My Profile
                </h1>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        {success}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Profile Info Card */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                                Profile Information
                            </h2>

                            {!loading && profile && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0">
                                            <img
                                                src={
                                                    document?.profileImage ||
                                                    "/uploads/profile/default.png"
                                                }
                                                alt="Profile"
                                                className="h-20 w-20 rounded-full object-cover border border-zinc-200"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold text-zinc-900">
                                                {profile.firstName} {profile.lastName}
                                            </h3>
                                            <p className="text-sm text-zinc-500">
                                                {profile.email}
                                            </p>
                                            <p className="text-xs text-zinc-400">
                                                {profile.role}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <p className="text-xs font-semibold text-zinc-400 uppercase mb-2">
                                            Contact
                                        </p>
                                        <p className="text-sm text-zinc-600">
                                            {phone || "Not provided"}
                                        </p>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-xs font-semibold text-zinc-400 uppercase mb-2">
                                            Address
                                        </p>
                                        <p className="text-sm text-zinc-600">
                                            {address || "Not set"}
                                        </p>
                                        {latitude && longitude && (
                                            <p className="text-xs text-zinc-400 mt-1">
                                                {latitude}, {longitude}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-xs font-semibold text-zinc-400 uppercase mb-2">
                                            Status
                                        </p>
                                        <p className="text-sm text-zinc-600">
                                            {profile.emailVerificationStatus ? (
                                                <span className="text-emerald-600 font-semibold">
                                                    ✓ Email Verified
                                                </span>
                                            ) : (
                                                <span className="text-amber-600 font-semibold">
                                                    ⏳ Email Not Verified
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Update Profile Form */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                                Update Profile
                            </h2>

                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) =>
                                            setFirstName(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) =>
                                            setLastName(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                                        Phone
                                    </label>
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) =>
                                            setPhone(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) =>
                                            setAddress(e.target.value)
                                        }
                                        placeholder="Street, City, Country"
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none"
                                    />
                                    <div className="relative mt-2">
                                        <div
                                            id="profile-map"
                                            className="w-full h-48 rounded-lg border border-zinc-200"
                                        ></div>
                                    </div>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                                            Latitude
                                        </label>
                                        <input
                                            id="latitude"
                                            type="text"
                                            value={latitude}
                                            onChange={(e) =>
                                                setLatitude(e.target.value)
                                            }
                                            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                                            Longitude
                                        </label>
                                        <input
                                            id="longitude"
                                            type="text"
                                            value={longitude}
                                            onChange={(e) =>
                                                setLongitude(e.target.value)
                                            }
                                            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={profileUpdating}
                                    className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                                >
                                    {profileUpdating
                                        ? "Updating..."
                                        : "Update Profile"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Change Password */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                                Change Password
                            </h2>

                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) =>
                                            setCurrentPassword(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) =>
                                            setNewPassword(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={passwordChanging}
                                    className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700"
                                >
                                    {passwordChanging
                                        ? "Changing..."
                                        : "Change Password"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Document Upload */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                                Documents
                            </h2>

                            {!loading && document && (
                                <div className="space-y-4">
                                    <p className="text-sm text-zinc-600">
                                        Current Documents:
                                    </p>
                                    {document.profileImage && (
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={document.profileImage}
                                                alt="Profile"
                                                className="h-12 w-12 rounded-lg object-cover border border-zinc-200"
                                            />
                                            <span className="text-xs text-zinc-500">
                                                Profile Image
                                            </span>
                                        </div>
                                    )}
                                    {document.nidFrontImage && (
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={document.nidFrontImage}
                                                alt="NID Front"
                                                className="h-12 w-16 rounded-lg object-cover border border-zinc-200"
                                            />
                                            <span className="text-xs text-zinc-500">
                                                NID Front
                                            </span>
                                        </div>
                                    )}
                                    {document.nidBackImage && (
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={document.nidBackImage}
                                                alt="NID Back"
                                                className="h-12 w-16 rounded-lg object-cover border border-zinc-200"
                                            />
                                            <span className="text-xs text-zinc-500">
                                                NID Back
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <form onSubmit={handleUploadDocument} className="mt-4 space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                                        Profile Image
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            setSelectedProfileImage(
                                                Array.from(
                                                    e.target.files || [],
                                                ),
                                            )
                                        }
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                                        NID Front Image
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            setSelectedNidFront(
                                                Array.from(
                                                    e.target.files || [],
                                                ),
                                            )
                                        }
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                                        NID Back Image
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            setSelectedNidBack(
                                                Array.from(
                                                    e.target.files || [],
                                                ),
                                            )
                                        }
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={documentUploading}
                                    className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700"
                                >
                                    {documentUploading
                                        ? "Uploading..."
                                        : "Upload Documents"}
                                </button>

                                <p className="text-xs text-zinc-400 mt-2">
                                    You can add documents but cannot remove
                                    them once uploaded.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
