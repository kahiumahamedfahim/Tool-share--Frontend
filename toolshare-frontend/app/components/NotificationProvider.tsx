"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import pusher from "@/app/lib/pusher";

interface NotificationData
{
    type: string;
    title: string;
    message: string;
    userId: string;
    userName: string;
    email: string;
    timestamp: string;
}

interface NotificationContextType
{
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
}>)
{
    const [
        notifications,
        setNotifications,
    ] = useState<NotificationData[]>([]);

    useEffect(() =>
    {
        const channel =
            pusher.subscribe(
                "admin-moderator-channel",
            );

        channel.bind(
            "document-submitted",
            (data: NotificationData) =>
            {
                setNotifications(
                    (previousNotifications) =>
                    [
                        data,
                        ...previousNotifications,
                    ],
                );
            },
        );

        return () =>
        {
            channel.unbind(
                "document-submitted",
            );

            pusher.unsubscribe(
                "admin-moderator-channel",
            );
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

export function useNotifications()
{
    const context =
        useContext(
            NotificationContext,
        );

    if (!context)
    {
        throw new Error(
            "useNotifications must be used inside NotificationProvider",
        );
    }

    return context;
}