"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getEvent, getEventRegistrations, getEventBookings, getEventBudget } from '@/utils/database.updated';
import { Event, Registration, VenueBooking, BudgetItem } from '@/types/database.types.updated';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, MapPinIcon, UsersIcon, ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import Link from 'next/link';

export default function ViewEventPage({ params }: { params: { eventId: string } }) {
  const { user } = useAuth() as { user: { id: string } | null };
  const router = useRouter();
  const unwrappedParams = use(params); // Unwrap the params using React.use()
  const { eventId } = unwrappedParams;
  
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [budget, setBudget] = useState<{
    items: BudgetItem[],
    total: { estimatedCost: number, actualCost: number }
  } | null>(null);

  useEffect(() => {
    async function fetchEventData() {
      try {
        const eventData = await getEvent(eventId);
        
        if (!eventData) {
          toast.error('Event not found');
          router.push('/dashboard/my-events');
          return;
        }
        
        // Check if user is the organizer
        if (user?.id !== eventData.organizer_id) {
          toast.error('You do not have permission to view this event');
          router.push('/dashboard/my-events');
          return;
        }
        
        setEvent(eventData);
        
        // Fetch related data in parallel
        const [registrationsData, venuesToUse, budgetData] = await Promise.all([
          getEventRegistrations(eventId),
          getEventBookings(eventId),
          getEventBudget(eventId),
        ]);
        
        setRegistrations(registrationsData);
        setVenues(venuesToUse);
        
        if (budgetData.length > 0) {
          const totalEstimated = budgetData.reduce((sum, item) => sum + item.estimated_cost, 0);
          const totalActual = budgetData.reduce((sum, item) => sum + (item.actual_cost || 0), 0);
          
          setBudget({
            items: budgetData,
            total: {
              estimatedCost: totalEstimated,
              actualCost: totalActual
            }
          });
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
        toast.error('Failed to load event details');
      } finally {
        setLoading(false);
      }
    }

    if (eventId && user?.id) {
      fetchEventData();
    }
  }, [eventId, user?.id, router]);

  function getStatusBadgeColor(status: Event['status']) {
    switch (status) {
      case 'draft': return 'bg-gray-400';
      case 'published': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Link href="/dashboard/my-events" className="flex items-center text-sm text-gray-500 hover:text-gray-700 mr-4">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to My Events
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading event details...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold text-center mt-4">Event not found</h2>
            <div className="flex justify-center mt-4">
              <Link href="/dashboard/my-events">
                <Button>Go back to My Events</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard/my-events" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to My Events
        </Link>
        
        <Link href={`/dashboard/my-events/edit/${event.id}`}>
          <Button variant="outline" size="sm">
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit Event
          </Button>
        </Link>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{event.name}</CardTitle>
              <CardDescription>
                <Badge className={`mt-2 ${getStatusBadgeColor(event.status)}`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-700 mb-4">{event.description || 'No description provided.'}</p>
              
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  <div>
                    <p><strong>Starts:</strong> {format(new Date(event.start_date), "MMMM d, yyyy 'at' h:mm a")}</p>
                    {event.end_date && (
                      <p><strong>Ends:</strong> {format(new Date(event.end_date), "MMMM d, yyyy 'at' h:mm a")}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  <p>{event.location || 'Location not specified'}</p>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <UsersIcon className="h-5 w-5 mr-2" />
                  <p>{event.capacity} attendees capacity</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="font-medium">Category</p>
                <p>{event.category || 'Not specified'}</p>
              </div>
              
              <div>
                <p className="font-medium">Created</p>
                <p>{format(new Date(event.created_at), "MMMM d, yyyy")}</p>
              </div>
              
              <div>
                <p className="font-medium">Last Updated</p>
                <p>{format(new Date(event.updated_at), "MMMM d, yyyy")}</p>
              </div>
              
              <div>
                <p className="font-medium">Registration Count</p>
                <p>{registrations.length} / {event.capacity}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="registrations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="registrations">
            Registrations ({registrations.length})
          </TabsTrigger>
          <TabsTrigger value="venues">
            Venues ({venues.length})
          </TabsTrigger>
          <TabsTrigger value="budget">
            Budget
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="registrations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              {registrations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No registrations yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-3 text-left">Registration Date</th>
                        <th className="py-2 px-3 text-left">Attendee</th>
                        <th className="py-2 px-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map((registration) => (
                        <tr key={registration.id} className="border-b">
                          <td className="py-3 px-3">{format(new Date(registration.registration_date), "MMM d, yyyy")}</td>
                          <td className="py-3 px-3">{registration.user_id}</td>
                          <td className="py-3 px-3">
                            {registration.check_in_status ? (
                              <Badge className="bg-green-500">Checked In</Badge>
                            ) : (
                              <Badge variant="outline">Not Checked In</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="venues" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Venues</CardTitle>
            </CardHeader>
            <CardContent>
              {venues.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No venues booked yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {venues.map((booking: any) => (
                    <Card key={booking.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">{booking.venues?.name || 'Unnamed Venue'}</h3>
                        <div className="space-y-2 text-sm">
                          <p><strong>Location:</strong> {booking.venues?.address || 'No address provided'}</p>
                          <p><strong>Capacity:</strong> {booking.venues?.capacity || 'Unknown'}</p>
                          <p><strong>Booking Time:</strong> {format(new Date(booking.start_time), "MMM d, yyyy h:mm a")} - {format(new Date(booking.end_time), "h:mm a")}</p>
                          <p><strong>Status:</strong> {booking.status}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="budget" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget</CardTitle>
            </CardHeader>
            <CardContent>
              {!budget || budget.items.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No budget items created yet</p>
              ) : (
                <>
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-gray-50">
                      <CardContent className="p-4">
                        <p className="text-sm font-medium mb-1">Estimated Budget</p>
                        <p className="text-2xl font-bold">${budget.total.estimatedCost.toFixed(2)}</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gray-50">
                      <CardContent className="p-4">
                        <p className="text-sm font-medium mb-1">Actual Expenses</p>
                        <p className="text-2xl font-bold">${budget.total.actualCost.toFixed(2)}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 px-3 text-left">Item</th>
                          <th className="py-2 px-3 text-left">Category</th>
                          <th className="py-2 px-3 text-right">Estimated Cost</th>
                          <th className="py-2 px-3 text-right">Actual Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {budget.items.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="py-3 px-3">{item.description}</td>
                            <td className="py-3 px-3">{item.category}</td>
                            <td className="py-3 px-3 text-right">${item.estimated_cost.toFixed(2)}</td>
                            <td className="py-3 px-3 text-right">${(item.actual_cost || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
