"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
    useNotifications,
    type NotificationData,
} from "./NotificationProvider";

export default function NotificationBell() {
    const {
        notifications,
        unreadCount,
        markAllAsRead,
        markAsRead,
    } = useNotifications();
    const router = useRouter();

    const [isOpen, setIsOpen] = useState(false);

    const openNotification = (
        link: string | null | undefined,
        index?: number,
    ) => {
        setIsOpen(false);
        if (index !== undefined) {
            markAsRead(index);
        }
        if (link) {
            router.push(link);
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => {
                    markAllAsRead();
                    setIsOpen(!isOpen);
                }}
                className="relative rounded-full p-2 hover:bg-gray-100"
            >
                <span className="text-xl">
                    🔔
                </span>

                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border bg-white shadow-lg">
                    <div className="border-b px-4 py-3">
                        <h3 className="font-semibold text-gray-800">
                            Notifications
                        </h3>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-gray-500">
                                No notifications
                            </div>
                        ) : (
                            notifications.map(
                                (notification, index) => (
                                    <div
                                        key={`${notification.timestamp}-${index}`}
                                        onClick={() =>
                                            openNotification(
                                                notification.link,
                                                index,
                                            )
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                            ) {
                                                openNotification(
                                                    notification.link,
                                                    index,
                                                );
                                            }
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        className={`border-b px-4 py-3 cursor-pointer focus:outline-none ${
                                            notification.read
                                                ? "bg-gray-50"
                                                : "bg-blue-50"
                                        }`}
                                    >
                                        <p className={`font-medium ${
                                            notification.read
                                                ? "text-gray-600"
                                                : "text-gray-800 font-semibold"
                                        }`}>
                                            {notification.title}
                                        </p>

                                        <p className="mt-1 text-sm text-gray-600">
                                            {notification.message}
                                        </p>

                                        <p className="mt-1 text-xs text-gray-400">
                                            {notification.timestamp}
                                        </p>

                                        {notification.link && (
                                            <p className="mt-2 text-[10px] text-blue-600 font-medium">
                                            ↗ Go to {notification.link}
                                            </p>
                                        )}
                                    </div>
                                ),
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
