"use client";

import { useEffect, useState } from "react";
import { getEvents, getEventSchedule } from "@/utils/database.updated";
import { getCurrentUser } from "@/utils/auth";
import { Event, ScheduleItem } from "@/types/database.types.updated";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function SchedulePage() {
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;
        setUser(currentUser);

        // Load events
        const userEvents = await getEvents();
        setEvents(userEvents);
      } catch (error) {
        console.error("Error loading events:", error);
        toast.error("Failed to load events");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const loadEventSchedule = async (eventId: string) => {
    if (!eventId) return;
    
    try {
      setIsLoading(true);
      const schedule = await getEventSchedule(eventId);
      setScheduleItems(schedule);
    } catch (error) {
      console.error("Error loading schedule items:", error);
      toast.error("Failed to load schedule");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const eventId = e.target.value;
    setSelectedEvent(eventId);
    if (eventId) {
      loadEventSchedule(eventId);
    } else {
      setScheduleItems([]);
    }
  };

  // Group schedule items by date
  const groupedSchedule = scheduleItems.reduce((acc: Record<string, ScheduleItem[]>, item) => {
    const date = new Date(item.start_time).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  // Format time function
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Event Schedule</h1>

      {isLoading && events.length === 0 ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* Event Selection */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <label htmlFor="event-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Event
            </label>
            <select
              id="event-select"
              value={selectedEvent}
              onChange={handleEventChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">Choose an event...</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <>
              {/* Schedule Display */}
              <div className="bg-white shadow-md rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Schedule</h2>
                  {user?.user_role === 'organizer' && (
                    <Link 
                      href={`/dashboard/manage-schedule?eventId=${selectedEvent}`} 
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Manage Schedule
                    </Link>
                  )}
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center min-h-[100px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : scheduleItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No schedule items found for this event.</p>
                    {user?.user_role === 'organizer' && (
                      <Link 
                        href={`/dashboard/manage-schedule?eventId=${selectedEvent}`}
                        className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        Create Schedule
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(groupedSchedule).map(([date, items]) => (
                      <div key={date} className="border-b pb-6 last:border-b-0">
                        <h3 className="font-medium text-lg mb-4">{date}</h3>
                        <div className="space-y-3">
                          {items.map((item) => (
                            <div key={item.id} className="flex border-l-4 border-indigo-500 pl-4">
                              <div className="w-36 flex-shrink-0">
                                <p className="font-medium">{formatTime(item.start_time)} - {formatTime(item.end_time)}</p>
                              </div>
                              <div>
                                <h4 className="font-medium">{item.title}</h4>
                                <p className="text-sm text-gray-600">{item.description}</p>
                                {item.location && (
                                  <p className="text-sm text-gray-600">Location: {item.location}</p>
                                )}
                                {item.speaker && (
                                  <p className="text-sm text-gray-600">Speaker: {item.speaker}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
