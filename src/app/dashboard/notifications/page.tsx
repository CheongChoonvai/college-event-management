"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "@/utils/auth";
import { getUserNotifications, markNotificationAsRead } from "@/utils/database";
import { Notification } from "@/types/database.types";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;
        
        const userNotifications = await getUserNotifications(currentUser.id);
        setNotifications(userNotifications);
      } catch (error) {
        console.error("Error loading notifications:", error);
        toast.error("Failed to load notifications");
      } finally {
        setIsLoading(false);
      }
    }
    
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to update notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((notification) => !notification.read);
      
      if (unreadNotifications.length === 0) {
        toast("No unread notifications");
        return;
      }
      
      await Promise.all(
        unreadNotifications.map((notification) => markNotificationAsRead(notification.id))
      );
      
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
      
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to update notifications");
    }
  };

  // Group notifications by date
  const notificationsByDate = notifications.reduce((acc: Record<string, Notification[]>, notification) => {
    const date = new Date(notification.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    
    if (!acc[date]) {
      acc[date] = [];
    }
    
    acc[date].push(notification);
    return acc;
  }, {});

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
          <p className="text-lg text-gray-600">No notifications yet</p>
          <p className="text-sm text-gray-500 mt-1">
            When you receive notifications, they will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(notificationsByDate).map(([date, dateNotifications]) => (
            <div key={date}>
              <h2 className="text-sm font-medium text-gray-500 mb-4">{date}</h2>
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {dateNotifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`${!notification.read ? "bg-indigo-50" : ""} hover:bg-gray-50`}
                    >
                      <div className="px-6 py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div
                              className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${
                                getNotificationTypeClass(notification.type).dot
                              }`}
                            ></div>
                            <div>
                              <p className="font-medium text-gray-900">{notification.title}</p>
                              <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                              <p className="mt-1 text-xs text-gray-400">
                                {new Date(notification.created_at).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="ml-4 text-xs text-indigo-600 hover:text-indigo-800"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getNotificationTypeClass(type: Notification["type"]) {
  switch (type) {
    case "info":
      return { dot: "bg-blue-500" };
    case "success":
      return { dot: "bg-green-500" };
    case "warning":
      return { dot: "bg-yellow-500" };
    case "error":
      return { dot: "bg-red-500" };
    default:
      return { dot: "bg-gray-500" };
  }
}
