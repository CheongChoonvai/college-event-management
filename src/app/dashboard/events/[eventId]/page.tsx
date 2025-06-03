"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getEvent, registerForEvent, getUserEventRegistrations } from "@/utils/database";
import { Event } from "@/types/database.types";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, MapPinIcon, UsersIcon, ArrowLeftIcon, TicketIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import Link from "next/link";

export default function EventDetailsPage({ params }: { params: { eventId: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const { eventId } = params;
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  useEffect(() => {
    async function fetchEventData() {
      try {
        const eventData = await getEvent(eventId);
        if (!eventData) {
          toast.error('Event not found');
          router.push('/dashboard/events');
          return;
        }
        setEvent(eventData);
        
        // Check if user is already registered
        if (user?.id) {
          const isRegistered = await checkIfRegistered(user.id, eventId);
          setAlreadyRegistered(isRegistered);
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
        toast.error('Failed to load event details');
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      fetchEventData();
    }
  }, [eventId, router, user?.id]);

  const checkIfRegistered = async (userId: string, eventId: string) => {
    try {
      const registrations = await getUserEventRegistrations(userId, eventId);
      return registrations.length > 0;
    } catch (error) {
      console.error('Error checking registration status:', error);
      return false;
    }
  };

  const handleRegister = async () => {
    if (!user) {
      toast.error('Please log in to register for this event');
      router.push('/login');
      return;
    }
    
    if (!event) return;
    
    setIsRegistering(true);
    
    try {
      await registerForEvent({
        userId: user.id,
        eventId: event.id,
        ticketType: 'Standard',
        amountPaid: event.price || 0,
        status: 'confirmed',
        paymentStatus: 'completed'
      });
      
      toast.success('Successfully registered for event!');
      setAlreadyRegistered(true);
      router.push('/dashboard/registrations');
    } catch (error: any) {
      console.error('Error registering for event:', error);
      toast.error(error.message || 'Failed to register for event');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/events" className="flex items-center text-sm text-gray-500 hover:text-gray-700 mr-4">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Events
        </Link>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      ) : !event ? (
        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold text-center">Event not found</h2>
            <div className="flex justify-center mt-4">
              <Link href="/dashboard/events">
                <Button>Go back to Events</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6 overflow-hidden">
            {event.image_url && (
              <div className="h-64 overflow-hidden">
                <img src={event.image_url} alt={event.title} className="w-full object-cover" />
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl">{event.title}</CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {event.category && (
                      <Badge variant="secondary" className="mr-2 mb-2">
                        {event.category}
                      </Badge>
                    )}
                    {event.status && (
                      <Badge
                        variant={
                          event.status === 'published'
                            ? 'success'
                            : event.status === 'cancelled'
                            ? 'destructive'
                            : 'outline'
                        }
                        className="mr-2 mb-2"
                      >
                        {event.status}
                      </Badge>
                    )}
                  </CardDescription>
                </div>

                {/* Registration Button */}
                {!alreadyRegistered ? (
                  <Button 
                    className="ml-auto" 
                    onClick={handleRegister} 
                    disabled={isRegistering || event.status === 'cancelled'}
                  >
                    {isRegistering ? 'Registering...' : 'Register Now'}
                  </Button>
                ) : (
                  <Badge variant="success" className="ml-auto px-4 py-2">
                    Already Registered
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Event Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2 text-gray-500" />
                      <div>
                        <span className="font-medium">Date & Time: </span>
                        <div>
                          {event.start_date && format(new Date(event.start_date), "PPP 'at' p")}
                          {event.end_date && event.end_date !== event.start_date && (
                            <> - {format(new Date(event.end_date), "PPP 'at' p")}</>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 mr-2 text-gray-500" />
                      <div>
                        <span className="font-medium">Location: </span>
                        <div>{event.location}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <UsersIcon className="h-5 w-5 mr-2 text-gray-500" />
                      <div>
                        <span className="font-medium">Capacity: </span>
                        <div>{event.capacity} attendees</div>
                      </div>
                    </div>
                    {event.price > 0 && (
                      <div className="flex items-center">
                        <TicketIcon className="h-5 w-5 mr-2 text-gray-500" />
                        <div>
                          <span className="font-medium">Price: </span>
                          <div>${event.price}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
