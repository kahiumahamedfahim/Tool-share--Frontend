"use client";

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import pusher from "@/app/lib/pusher";
import api from "@/app/lib/axios";

export interface NotificationData {
    type: string;
    title: string;
    message: string;
    userId: string;
    userName: string;
    email: string;
    timestamp: string;

    // Optional rental context so clicking a notification
    // can redirect to the actual workflow page.
    rentalId?: string | null;
    link?: string | null;

    // Read/unread state
    read?: boolean;
}

interface NotificationContextType {
    notifications: NotificationData[];
    unreadCount: number;
    markAllAsRead: () => void;
    markAsRead: (index: number) => void;
}

const NotificationContext =
    createContext<NotificationContextType | undefined>(undefined);

const MAX_STORED_NOTIFICATIONS = 20;

const buildStorageKey = (userId: string) =>
    `toolshare-notifications-${userId}`;

export default function NotificationProvider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [notifications, setNotifications] =
        useState<NotificationData[]>([]);

    const subscribedIdentityRef = useRef<string | null>(null);

    const pathname = usePathname();

    const unreadCount = notifications.filter(
        (n) => n.read !== true,
    ).length;

    const markAllAsRead = () => {
        setNotifications(
            (previousNotifications) =>
                previousNotifications.map((n) => ({
                    ...n,
                    read: true,
                })),
        );
    };

    const markAsRead = (index: number) => {
        setNotifications(
            (previousNotifications) =>
                previousNotifications.map((n, i) => {
                    if (i === index) {
                        return { ...n, read: true };
                    }
                    return n;
                }),
        );
    };

    useEffect(() => {
        let mounted = true;

        const handleConnectionStateChange = (state: {
            previous: string;
            current: string;
        }) => {
            console.info(
                `[notifications] Pusher connection: ${state.previous} -> ${state.current}`,
            );
        };

        pusher.connection.bind("state_change", handleConnectionStateChange);

        const addNotification = (
            data: NotificationData,
        ) => {
            if (!mounted) {
                return;
            }

            const normalized: NotificationData = {
                ...data,
                read: false,
                link:
                    data.link ??
                    (data.rentalId
                        ? `/rentals/request/${data.rentalId}`
                        : null),
            };

            setNotifications(
                (previousNotifications) => [
                    normalized,
                    ...previousNotifications,
                ].slice(0, MAX_STORED_NOTIFICATIONS),
            );
        };

        const unsubscribeAll = (
            userId: string,
            role: string,
        ) => {
            const channelNames =
                role === "ADMIN" || role === "MODERATOR"
                    ? ["admin-moderator-channel"]
                    : role === "RIDER"
                      ? [`rider-${userId}-channel`]
                      : role === "USER"
                        ? [`owner-${userId}-channel`, `renter-${userId}-channel`]
                        : [];

            channelNames.forEach((channelName) => {
                const channel = pusher.channel(channelName);

                if (channel) {
                    channel.unbind_all();

                    pusher.unsubscribe(channelName);
                }
            });
        };

        const subscribeAll = (
            userId: string,
            role: string,
        ) => {
            if (role === "USER") {
                const userEvents = [
                    "new-rental-request",
                    "new-negotiation-offer",
                    "rental-request-accepted",
                    "rental-request-rejected",
                    "payment-update",
                    "handover-verification",
                    "return-verification",
                ];

                [`owner-${userId}-channel`, `renter-${userId}-channel`]
                    .forEach((channelName) => {
                        const channel = pusher.subscribe(channelName);
                        userEvents.forEach((event) =>
                            channel.bind(event, addNotification),
                        );
                    });
            } else if (role === "RIDER") {
                /*
                 * RIDER CHANNEL
                 */
                const riderChannel =
                    pusher.subscribe(`rider-${userId}-channel`);

                riderChannel.bind("handover-verification", addNotification);

                riderChannel.bind("return-verification", addNotification);

                riderChannel.bind("payment-update", addNotification);

            } else if (role === "ADMIN" || role === "MODERATOR") {
                const adminChannel = pusher.subscribe("admin-moderator-channel");
                [
                    "document-submitted",
                    "new-rental-request",
                    "new-negotiation-offer",
                    "rental-request-accepted",
                    "rental-request-rejected",
                    "payment-update",
                    "handover-verification",
                    "return-verification",
                ].forEach((event) => adminChannel.bind(event, addNotification));
            }
        };

        initializeNotifications();

        async function initializeNotifications() {
            /*
             * ================================
             * GET AUTHENTICATED USER
             * ================================
             */

            let userId: string | null = null;

            let role: string | null = null;

            try {
                const response =
                    await api.get<{
                        userId: string;
                        role: string;
                    }>("/auth/profile");

                if (!mounted) {
                    return;
                }

                userId = response.data?.userId ?? null;

                role = response.data?.role ?? null;
            } catch (error) {
                /* Not logged in. */
            }

            const identity = userId && role
                ? `${role}:${userId}`
                : null;

            // Already subscribed for this login.

            if (identity === subscribedIdentityRef.current) {
                return;
            }

            // Cleanup previous identity first.

            if (
                subscribedIdentityRef.current &&
                mounted
            ) {
                const [
                    previousRole,
                    previousUserId,
                ] = subscribedIdentityRef.current.split(":");

                if (previousUserId) {
                    unsubscribeAll(
                        previousUserId,
                        previousRole,
                    );
                }

                subscribedIdentityRef.current = null;

                if (mounted) {
                    setNotifications([]);
                }
            }

            if (!userId || !role) {
                return;
            }

            // Load this user's stored history.

            try {
                const stored =
                    window.localStorage.getItem(
                        buildStorageKey(userId),
                    );

                if (stored && mounted) {
                    setNotifications(
                        JSON.parse(stored),
                    );
                }
            } catch {
                /* Ignore storage errors. */
            }

            // Subscribe.

            if (!mounted) {
                return;
            }

            subscribedIdentityRef.current = identity;

            subscribeAll(userId, role);
        }

        /*
         * Persist the notification list
         * for the subscribed user whenever
         * it changes.
         */

        return () => {
            mounted = false;
            pusher.connection.unbind("state_change", handleConnectionStateChange);

            /*
             * Fully teardown on unmount/remove
             * so the next effect run (strict mode
             * double-mount, login/logout changes)
             * subscribes fresh.
             */

            const currentIdentity =
                subscribedIdentityRef.current;

            if (currentIdentity) {
                const [
                    previousRole,
                    previousUserId,
                ] = currentIdentity.split(":");

                if (previousUserId) {
                    unsubscribeAll(
                        previousUserId,
                        previousRole,
                    );
                }

                subscribedIdentityRef.current = null;
            }
        };
    }, [pathname]);

    /*
     * Separate effect: persist notifications
     * to localStorage whenever they change,
     * scoped to the current identity.
     */

    useEffect(() => {
        const identity =
            subscribedIdentityRef.current;

        if (!identity) {
            return;
        }

        const [, userId] = identity.split(":");

        if (!userId) {
            return;
        }

        try {
            window.localStorage.setItem(
                buildStorageKey(userId),
                JSON.stringify(notifications),
            );
        } catch {
            /* Ignore storage errors. */
        }
    }, [notifications]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                markAllAsRead,
                markAsRead,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context =
        useContext(NotificationContext);

    if (!context) {
        throw new Error(
            "useNotifications must be used inside NotificationProvider",
        );
    }

    return context;
}
