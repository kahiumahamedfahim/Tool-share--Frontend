"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import pusher from "@/app/lib/pusher";

interface NotificationData {
    type: string;
    title: string;
    message: string;
    userId: string;
    userName: string;
    email: string;
    timestamp: string;
}

interface NotificationContextType {
    notifications: NotificationData[];
}

const NotificationContext =
    createContext<
        NotificationContextType | undefined
    >(undefined);

export default function NotificationProvider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [
        notifications,
        setNotifications,
    ] = useState<NotificationData[]>([]);

    useEffect(() => {
        /*
         * Admin / Moderator notifications
         */
        const adminModeratorChannel =
            pusher.subscribe(
                "admin-moderator-channel",
            );

        adminModeratorChannel.bind(
            "document-submitted",
            (data: NotificationData) => {
                setNotifications(
                    (previousNotifications) => [
                        data,
                        ...previousNotifications,
                    ],
                );
            },
        );

        /*
         * Get logged-in user's ID
         *
         * Your existing project stores user information
         * in localStorage.
         */
        const storedUser =
            localStorage.getItem("user");

        let userId: string | null = null;

        if (storedUser) {
            try {
                const parsedUser =
                    JSON.parse(storedUser);

                userId =
                    parsedUser?.userId ?? null;
            } catch {
                userId = null;
            }
        }

        /*
         * Renter notification channel
         *
         * Backend currently uses:
         * owner-${renterId}-channel
         */
        let userChannel:
            ReturnType<typeof pusher.subscribe> | null =
            null;

        if (userId) {
            userChannel =
                pusher.subscribe(
                    `owner-${userId}-channel`,
                );

            userChannel.bind(
                "rental-request-accepted",
                (data: NotificationData) => {
                    setNotifications(
                        (previousNotifications) => [
                            data,
                            ...previousNotifications,
                        ],
                    );
                },
            );

            userChannel.bind(
                "rental-request-rejected",
                (data: NotificationData) => {
                    setNotifications(
                        (previousNotifications) => [
                            data,
                            ...previousNotifications,
                        ],
                    );
                },
            );
        }

        return () => {
            /*
             * Admin / Moderator cleanup
             */
            adminModeratorChannel.unbind(
                "document-submitted",
            );

            pusher.unsubscribe(
                "admin-moderator-channel",
            );

            /*
             * User cleanup
             */
            if (userChannel && userId) {
                userChannel.unbind(
                    "rental-request-accepted",
                );

                userChannel.unbind(
                    "rental-request-rejected",
                );

                pusher.unsubscribe(
                    `owner-${userId}-channel`,
                );
            }
        };
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context =
        useContext(
            NotificationContext,
        );

    if (!context) {
        throw new Error(
            "useNotifications must be used inside NotificationProvider",
        );
    }

    return context;
}