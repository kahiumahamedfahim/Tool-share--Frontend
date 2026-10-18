"use client";

import { useEffect, useState } from "react";

import AdminNavbar from "@/app/components/admin/AdminNavbar";
import ModeratorNavbar from "@/app/components/moderator/ModeratorNavbar";
import UserNavbar from "@/app/components/user/usernavbar";

export default function RoleBasedNavbar() {
    const [userRole, setUserRole] = useState<
        "ADMIN" | "MODERATOR" | "USER" | null
    >(null);

    useEffect(() => {
        const role = localStorage.getItem("userRole");

        if (
            role === "ADMIN" ||
            role === "MODERATOR" ||
            role === "USER"
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

    return null;
}