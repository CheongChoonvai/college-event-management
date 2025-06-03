"use client";

import { useEffect, useState } from "react";
import { getEventsByOrganizer } from "@/utils/database.updated";
import { Event } from "@/types/database.types.updated";
import { useAuth } from "@/hooks/useAuth";
import DashboardCard from "@/components/dashboard/DashboardCard";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  PencilIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";

export default function MyEventsPage() {
  const { user, loading: authLoading, userId } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch events when auth is not loading and we have a userId
    if (!authLoading && userId) {
      const fetchEvents = async () => {
        try {
          console.log(`Attempting to fetch events for user ID: ${userId}`);
          const eventsData = await getEventsByOrganizer(userId);

          if (Array.isArray(eventsData)) {
            setEvents(eventsData);
            console.log(`Successfully set ${eventsData.length} events`);
          } else {
            console.error("Events data is not an array:", eventsData);
            toast.error("Failed to load your events: Invalid data format");
            setEvents([]);
          }
        } catch (error) {
          toast.error("Failed to load your events");
          console.error("Error fetching events:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchEvents();
    } else if (!authLoading) {
      // If auth is done loading but we still don't have a userId
      console.log("Auth loaded but no user ID available");
      setLoading(false);
    }
  }, [userId, authLoading]);

  function getStatusBadgeColor(status: Event["status"]) {
    switch (status) {
      case "draft":
        return "bg-gray-400";
      case "published":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      case "completed":
        return "bg-blue-500";
      default:
        return "bg-gray-400";
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Events</h1>
        <Link href="/dashboard/create-event">
          <Button variant="default">Create New Event</Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="flex justify-end space-x-2">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">
            You don't have any events yet
          </h2>
          <p className="text-gray-500 mb-6">
            Create your first event to get started
          </p>
          <Link href="/dashboard/create-event">
            <Button>Create an Event</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <DashboardCard
              key={event.id}
              className="h-full"
              title={event.title}
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{event.name}</h3>
                <Badge className={`mb-3 ${getStatusBadgeColor(event.status)}`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </Badge>
                <p className="text-sm text-gray-700 mb-4">
                  {event.description}
                </p>

                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(
                    new Date(event.start_date),
                    "MMMM d, yyyy 'at' hh:mm a"
                  )}
                </div>

                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  {event.location}
                </div>

                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <UsersIcon className="h-4 w-4 mr-2" />
                  {event.capacity} capacity
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Link href={`/dashboard/my-events/edit/${event.id}`}>
                  <Button variant="outline" size="sm">
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </Link>
                <Link href={`/dashboard/my-events/view/${event.id}`}>
                  <Button size="sm">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </Link>
              </div>
            </DashboardCard>
          ))}
        </div>
      )}
    </div>
  );
}
