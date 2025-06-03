"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getEvent, updateEvent } from '@/utils/database.updated';
import { Event } from '@/types/database.types.updated';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { CalendarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function EditEventPage({ params }: { params: { eventId: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const { eventId } = params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    capacity: 0,
    category: '',
    status: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    async function fetchEvent() {
      try {
        const eventData = await getEvent(eventId);
        
        if (!eventData) {
          toast.error('Event not found');
          router.push('/dashboard/my-events');
          return;
        }
        
        // Check if user is the organizer
        if (user?.id !== eventData.organizer_id) {
          toast.error('You do not have permission to edit this event');
          router.push('/dashboard/my-events');
          return;
        }
        
        setEvent(eventData);
        setFormData({
          name: eventData.name,
          description: eventData.description || '',
          location: eventData.location || '',
          capacity: eventData.capacity || 0,
          category: eventData.category || '',
          status: eventData.status,
          start_date: eventData.start_date ? format(new Date(eventData.start_date), "yyyy-MM-dd'T'HH:mm") : '',
          end_date: eventData.end_date ? format(new Date(eventData.end_date), "yyyy-MM-dd'T'HH:mm") : '',
        });
      } catch (error) {
        console.error('Error fetching event:', error);
        toast.error('Failed to load event details');
      } finally {
        setLoading(false);
      }
    }

    if (eventId && user?.id) {
      fetchEvent();
    }
  }, [eventId, user?.id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      category: value,
    });
  };

  const handleStatusChange = (value: string) => {
    setFormData({
      ...formData,
      status: value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event) return;
    
    try {
      setSaving(true);
      
      const updateData: Partial<Event> = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        capacity: Number(formData.capacity),
        category: formData.category,
        status: formData.status as Event['status'],
        start_date: formData.start_date,
        end_date: formData.end_date,
      };
      
      const updatedEvent = await updateEvent(eventId, updateData);
      
      if (updatedEvent) {
        toast.success('Event updated successfully');
        router.push('/dashboard/my-events');
      } else {
        toast.error('Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('An error occurred while updating the event');
    } finally {
      setSaving(false);
    }
  };

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
      <div className="flex items-center mb-6">
        <Link href="/dashboard/my-events" className="flex items-center text-sm text-gray-500 hover:text-gray-700 mr-4">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to My Events
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Edit Event</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="seminar">Seminar</SelectItem>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="party">Party</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleChange}
                  min={1}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date & Time</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="start_date"
                      name="start_date"
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="end_date">End Date & Time</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="end_date"
                      name="end_date"
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Link href="/dashboard/my-events">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <span className="animate-spin mr-2">◌</span>
                    Saving...
                  </>
                ) : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
