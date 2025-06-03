"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/utils/auth";
import { getEvents, getUserRegistrations, getUserNotifications } from "@/utils/database";
import { User, Event, Registration, Notification } from "@/types/database.types";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<Registration[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const currentUser = await getCurrentUser();
        
        if (!currentUser) {
          return;
        }
        
        setUser(currentUser as unknown as User);
        
        // Load events with a limit of 3
        const events = await getEvents({ limit: 3 });
        setUpcomingEvents(events);
        
        // Load user registrations
        const registrations = await getUserRegistrations(currentUser.id);
        setUserRegistrations(registrations);
        
        // Load user notifications
        const userNotifications = await getUserNotifications(currentUser.id);
        setNotifications(userNotifications);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Upcoming Events */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Upcoming Events</h2>
            <Link 
              href="/dashboard/events" 
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div key={event.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                  <Link href={`/dashboard/events/${event.id}`}>
                    <h3 className="font-medium text-gray-900 hover:text-indigo-600">
                      {event.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500">
                    {new Date(event.start_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No upcoming events</p>
            )}
          </div>
        </div>

        {/* My Registrations */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">My Registrations</h2>
            <Link 
              href="/dashboard/registrations" 
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">            {userRegistrations.length > 0 ? (
              userRegistrations.slice(0, 3).map((registration) => (
                <div key={registration.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                  <p className="font-medium text-gray-900">
                    {registration.events?.title || `Event #${registration.event_id.slice(0, 8)}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: <span className="capitalize">{registration.status}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Ticket: {registration.ticket_type}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No registrations yet</p>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <Link 
              href="/dashboard/notifications" 
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.slice(0, 3).map((notification) => (
                <div 
                  key={notification.id} 
                  className={`border-b pb-3 last:border-b-0 last:pb-0 ${!notification.read ? "bg-indigo-50 -mx-2 px-2 py-1 rounded" : ""}`}
                >
                  <p className="font-medium text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-500">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No notifications</p>
            )}
          </div>
        </div>
      </div>

      {/* Additional actions or information */}
      {user?.user_role === "organizer" && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Organizer Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/dashboard/create-event"
              className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg text-center"
            >
              <h3 className="font-medium text-indigo-700 mb-2">Create New Event</h3>
              <p className="text-sm text-gray-600">Set up a new event with tickets and details</p>
            </Link>
            <Link
              href="/dashboard/my-events"
              className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg text-center"
            >
              <h3 className="font-medium text-indigo-700 mb-2">Manage My Events</h3>
              <p className="text-sm text-gray-600">Edit details, track registrations and more</p>
            </Link>
            <Link
              href="/dashboard/budget"
              className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg text-center"
            >
              <h3 className="font-medium text-indigo-700 mb-2">Budget Management</h3>
              <p className="text-sm text-gray-600">Track expenses and revenue for your events</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
