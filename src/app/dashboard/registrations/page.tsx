"use client";

import { useEffect, useState } from "react";
import { getUserRegistrations } from "@/utils/database";
import { getCurrentUser } from "@/utils/auth";
import { Registration } from "@/types/database.types";
import Link from "next/link";
import { CalendarIcon, MapPinIcon, TicketIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRegistrations() {
      try {
        setIsLoading(true);
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          return;
        }

        const userRegistrations = await getUserRegistrations(currentUser.id);
        console.log("Loaded registrations:", userRegistrations); // Add this for debugging
        setRegistrations(userRegistrations);
      } catch (error) {
        console.error("Error fetching registrations:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadRegistrations();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Registrations</h1>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : registrations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-xl text-gray-600 mb-4">You haven't registered for any events yet.</p>
          <Link
            href="/dashboard/events"
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {registrations.map((registration) => {
            const event = registration.events;
            return (
              <div key={registration.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {event?.image_url && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={event.image_url}
                      alt={event?.name || event?.title || "Event"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2">{event?.name || event?.title || "Unknown Event"}</h2>
                  
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {event?.start_date && (
                        <span>{format(new Date(event.start_date), "MMMM d, yyyy 'at' h:mm a")}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      <span>{event?.location || "Location not specified"}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <TicketIcon className="h-4 w-4 mr-2" />
                      <span className="font-medium">Ticket:</span> {registration.ticket_type}
                    </div>
                  </div>
                  
                  <div className="mb-4 space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Registration Date:</span>{" "}
                      {format(new Date(registration.registration_date), "MMMM d, yyyy")}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      <span 
                        className={`capitalize ${
                          registration.status === "confirmed" 
                            ? "text-green-600" 
                            : registration.status === "cancelled" 
                              ? "text-red-600" 
                              : "text-yellow-600"
                        }`}
                      >
                        {registration.status}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Payment:</span>{" "}
                      <span 
                        className={`capitalize ${
                          registration.payment_status === "completed" 
                            ? "text-green-600" 
                            : registration.payment_status === "refunded" 
                              ? "text-blue-600" 
                              : "text-yellow-600"
                        }`}
                      >
                        {registration.payment_status}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Amount Paid:</span> ${registration.amount_paid}
                    </p>
                  </div>
                  
                  {event?.id && (
                    <div className="flex space-x-2">
                      <Link
                        href={`/dashboard/events/${event.id}`}
                        className="inline-block flex-1 text-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                      >
                        View Event
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
