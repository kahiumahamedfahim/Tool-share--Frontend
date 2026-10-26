"use client";

import { useEffect, useState } from "react";

import AdminNavbar from "@/app/components/admin/AdminNavbar";
import ModeratorNavbar from "@/app/components/moderator/ModeratorNavbar";
import UserNavbar from "@/app/components/user/usernavbar";
import RiderNavbar from "@/app/components/rider/RiderNavbar";

export default function RoleBasedNavbar() {
    const [userRole, setUserRole] = useState<
        "ADMIN" | "MODERATOR" | "USER" | "RIDER" | null
    >(null);

    useEffect(() => {
        const role = localStorage.getItem("userRole");

        if (
            role === "ADMIN" ||
            role === "MODERATOR" ||
            role === "USER" ||
            role === "RIDER"
        ) {
            setUserRole(role);
        }
    }, []);

    if (userRole === "ADMIN") {
        return <AdminNavbar />;
    }

    if (userRole === "MODERATOR") {
        return <ModeratorNavbar />;
    }

    if (userRole === "USER") {
        return <UserNavbar />;
    }

    if (userRole === "RIDER") {
        return <RiderNavbar />;
    }

    return null;
}
