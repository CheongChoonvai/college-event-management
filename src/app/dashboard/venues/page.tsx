"use client";

import { useEffect, useState } from "react";
import { getVenues } from "@/utils/database.updated";
import { getCurrentUser } from "@/utils/auth";
import { Venue } from "@/types/database.types.updated";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  useEffect(() => {
    async function loadVenues() {
      try {
        setIsLoading(true);
        const allVenues = await getVenues();
        setVenues(allVenues);
      } catch (error) {
        console.error("Error fetching venues:", error);
        toast.error("Failed to load venues");
      } finally {
        setIsLoading(false);
      }
    }

    loadVenues();
  }, []);

  const handleVenueSelect = async (venueId: string) => {
    try {
      const venue = await getVenue(venueId);
      setSelectedVenue(venue);
    } catch (error) {
      console.error("Error fetching venue details:", error);
      toast.error("Failed to load venue details");
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Venues</h1>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Venues List */}
          <div className="col-span-1 bg-white shadow-md rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Available Venues</h2>
            <div className="space-y-2">
              {venues.length > 0 ? (
                venues.map((venue) => (
                  <div 
                    key={venue.id} 
                    onClick={() => handleVenueSelect(venue.id)}
                    className="p-3 border rounded-md cursor-pointer hover:bg-indigo-50 transition-colors"
                  >
                    <h3 className="font-medium">{venue.name}</h3>
                    <p className="text-sm text-gray-600">Capacity: {venue.capacity}</p>
                    <p className="text-sm text-gray-600">${venue.cost_per_hour}/hour</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No venues available</p>
              )}
            </div>
          </div>

          {/* Venue Details */}
          <div className="col-span-2 bg-white shadow-md rounded-lg p-6">
            {selectedVenue ? (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2">{selectedVenue.name}</h2>
                  <p className="text-sm text-gray-600 mb-2">{selectedVenue.address}</p>
                  <div className="flex items-center mb-2">
                    <span className="font-medium text-gray-700">Capacity:</span>
                    <span className="ml-2">{selectedVenue.capacity} people</span>
                  </div>
                  <div className="flex items-center mb-2">
                    <span className="font-medium text-gray-700">Cost:</span>
                    <span className="ml-2">${selectedVenue.cost_per_hour} per hour</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-medium text-gray-700 mb-2">Facilities:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedVenue.facilities.map((facility, index) => (
                      <span 
                        key={index} 
                        className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-sm"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-medium text-gray-700 mb-2">Contact Information:</h3>
                  <p className="text-sm">{selectedVenue.contact_info}</p>
                </div>

                <div className="flex space-x-3 mt-6">
                  <Link 
                    href={`/dashboard/venue-booking?venue=${selectedVenue.id}`}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Book this Venue
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[200px] text-gray-500">
                <p>Select a venue to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
