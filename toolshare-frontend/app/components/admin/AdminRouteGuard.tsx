"use client";

import { useEffect } from "react";
import { notFound } from "next/navigation";

export default function AdminRouteGuard() {
  useEffect(() => {
    const role =
      localStorage.getItem("userRole");

    if (role !== "ADMIN") {
      notFound();
    }
  }, []);

  return null;
}