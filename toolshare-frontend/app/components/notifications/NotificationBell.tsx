"use client";

import { useState } from "react";
import { useNotifications } from "./NotificationProvider";

export default function NotificationBell() {
    const { notifications } = useNotifications();

    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative rounded-full p-2 hover:bg-gray-100"
            >
                <span className="text-xl">
                    🔔
                </span>

                {notifications.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
                        {notifications.length}
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
                                        className="border-b px-4 py-3 hover:bg-gray-50"
                                    >
                                        <p className="font-medium text-gray-800">
                                            {notification.title}
                                        </p>

                                        <p className="mt-1 text-sm text-gray-600">
                                            {notification.message}
                                        </p>

                                        <p className="mt-1 text-xs text-gray-400">
                                            {notification.timestamp}
                                        </p>
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