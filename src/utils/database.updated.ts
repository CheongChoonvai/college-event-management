import { supabase } from '@/lib/supabase';
import {
  Event, Registration, User, BudgetItem, Sponsor, Sponsorship, Venue,
  Notification, VenueBooking, ScheduleItem, Volunteer, ReportTemplate,
  GeneratedReport
} from '@/types/database.types.updated';

// User Functions
export async function getUser(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  
  return data as User;
}

export async function updateUserProfile(userId: string, userData: Partial<User>): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update(userData)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
  
  return data as User;
}

// Event Functions
export async function createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .insert([eventData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating event:', error);
    return null;
  }
  
  return data as Event;
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();
  
  if (error) {
    console.error('Error fetching event:', error);
    return null;
  }
  
  return data as Event;
}

export async function getEvents(options: { 
  limit?: number, 
  category?: string,
  status?: Event['status'],
  organizerId?: string
} = {}): Promise<Event[]> {
  let query = supabase.from('events').select('*');
  
  if (options.category) {
    query = query.eq('category', options.category);
  }
  
  if (options.status) {
    query = query.eq('status', options.status);
  }
  
  if (options.organizerId) {
    // Fix: ensure we're using the correct column name for organizer_id
    query = query.eq('organizer_id', options.organizerId);
  }
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  try {
    // Add more detailed logging
    console.log(`Executing query for events ${options.organizerId ? `with organizer_id: ${options.organizerId}` : ''}`);
    
    const { data, error } = await query.order('start_date', { ascending: true });
    
    if (error) {
      // Enhanced error logging with more details
      console.error('Error fetching events:', error);
      console.error('Error details:', JSON.stringify({
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      }));
      return [];
    }
    
    console.log(`Successfully fetched ${data?.length || 0} events`);
    return data;
  } catch (e) {
    console.error('Exception fetching events:', e);
    return [];
  }
}

export async function getEventsByOrganizer(organizerId: string): Promise<Event[]> {
  try {
    if (!organizerId) {
      console.error('Error: organizerId is undefined or null');
      return [];
    }
    
    console.log(`Fetching events for organizer: ${organizerId}`);
    
    // We can reuse the existing getEvents function with organizerId as an option
    const events = await getEvents({ organizerId });
    console.log(`Found ${events.length} events for organizer ${organizerId}`);
    return events;
  } catch (e) {
    console.error('Error fetching events by organizer:', e);
    return [];
  }
}

export async function updateEvent(eventId: string, eventData: Partial<Event>): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .update({ ...eventData, updated_at: new Date().toISOString() })
    .eq('id', eventId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating event:', error);
    return null;
  }
  
  return data as Event;
}

// Registration Functions
export async function registerForEvent({
  userId,
  eventId,
  ticketType,
  amountPaid,
  status = 'confirmed',
  paymentStatus = 'completed',
  specialRequirements = ''
}) {
  try {
    // Check if already registered
    const { data: existingRegistration, error: checkError } = await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(checkError.message);
    }
    
    if (existingRegistration) {
      throw new Error('You are already registered for this event');
    }
    
    // Check event capacity
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('capacity')
      .eq('id', eventId)
      .single();
      
    if (eventError) {
      throw new Error('Failed to check event capacity');
    }
    
    // Count current registrations
    const { count, error: countError } = await supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .neq('status', 'cancelled');
      
    if (countError) {
      throw new Error('Failed to check registration count');
    }
    
    if (count && event && count >= event.capacity) {
      throw new Error('Event is at full capacity');
    }
    
    // Create registration
    const { data, error } = await supabase
      .from('registrations')
      .insert({
        user_id: userId,
        event_id: eventId,
        registration_date: new Date().toISOString(),
        status: status,
        payment_status: paymentStatus,
        ticket_type: ticketType,
        amount_paid: amountPaid,
        special_requirements: specialRequirements
      })
      .select()
      .single();
      
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error in registerForEvent:', error);
    throw error;
  }
}

export async function getEventRegistrations(eventId: string): Promise<Registration[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('event_id', eventId);
  
  if (error) {
    console.error('Error fetching event registrations:', error);
    return [];
  }
  
  return data as Registration[];
}

export async function getUserRegistrations(userId: string): Promise<Registration[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select('*, events(*)')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching user registrations:', error);
    return [];
  }
  
  return data as any;
}

export async function checkInRegistration(registrationId: string): Promise<Registration | null> {
  const { data, error } = await supabase
    .from('registrations')
    .update({ 
      check_in_status: true,
      check_in_time: new Date().toISOString()
    })
    .eq('id', registrationId)
    .select()
    .single();
  
  if (error) {
    console.error('Error checking in registration:', error);
    return null;
  }
  
  return data as Registration;
}

// Venue Functions
export async function getVenues(options: {
  limit?: number,
  minCapacity?: number
} = {}): Promise<Venue[]> {
  let query = supabase.from('venues').select('*');
  
  if (options.minCapacity) {
    query = query.gte('capacity', options.minCapacity);
  }
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching venues:', error);
    return [];
  }
  
  return data as Venue[];
}

export async function getVenue(venueId: string): Promise<Venue | null> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', venueId)
    .single();
  
  if (error) {
    console.error('Error fetching venue:', error);
    return null;
  }
  
  return data as Venue;
}

// Venue Booking Functions
export async function bookVenue(bookingData: Omit<VenueBooking, 'id' | 'created_at' | 'updated_at'>): Promise<VenueBooking | null> {
  const { data, error } = await supabase
    .from('venue_bookings')
    .insert([bookingData])
    .select()
    .single();
  
  if (error) {
    console.error('Error booking venue:', error);
    return null;
  }
  
  return data as VenueBooking;
}

export async function getVenueBookings(venueId: string): Promise<VenueBooking[]> {
  const { data, error } = await supabase
    .from('venue_bookings')
    .select('*')
    .eq('venue_id', venueId);
  
  if (error) {
    console.error('Error fetching venue bookings:', error);
    return [];
  }
  
  return data as VenueBooking[];
}

export async function getEventBookings(eventId: string): Promise<VenueBooking[]> {
  const { data, error } = await supabase
    .from('venue_bookings')
    .select('*, venues(*)')
    .eq('event_id', eventId);
  
  if (error) {
    console.error('Error fetching event bookings:', error);
    return [];
  }
  
  return data as any;
}

// Budget Functions
export async function createBudgetItem(budgetData: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>): Promise<BudgetItem | null> {
  const { data, error } = await supabase
    .from('budget_items')
    .insert([budgetData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating budget item:', error);
    return null;
  }
  
  return data as BudgetItem;
}

export async function getEventBudget(eventId: string): Promise<BudgetItem[]> {
  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('event_id', eventId);
  
  if (error) {
    console.error('Error fetching event budget:', error);
    return [];
  }
  
  return data as BudgetItem[];
}

export async function updateBudgetItem(itemId: string, updateData: Partial<BudgetItem>): Promise<BudgetItem | null> {
  const { data, error } = await supabase
    .from('budget_items')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating budget item:', error);
    return null;
  }
  
  return data as BudgetItem;
}

export async function deleteBudgetItem(itemId: string): Promise<boolean> {
  const { error } = await supabase
    .from('budget_items')
    .delete()
    .eq('id', itemId);
  
  if (error) {
    console.error('Error deleting budget item:', error);
    return false;
  }
  
  return true;
}

export async function getBudgetSummary(eventId: string) {
  const { data: budget, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching budget summary:', error);
    return null;
  }

  const total = {
    estimatedCost: 0,
    actualCost: 0
  };

  const categories: Record<string, { estimated: number, actual: number }> = {};

  budget.forEach((item: BudgetItem) => {
    // Add to total
    total.estimatedCost += item.estimated_cost;
    total.actualCost += item.actual_cost || 0;

    // Add to category
    if (!categories[item.category]) {
      categories[item.category] = { estimated: 0, actual: 0 };
    }
    categories[item.category].estimated += item.estimated_cost;
    categories[item.category].actual += item.actual_cost || 0;
  });

  return {
    total,
    categories,
    items: budget
  };
}

// Schedule Functions
export async function createScheduleItem(scheduleData: Omit<ScheduleItem, 'id' | 'created_at' | 'updated_at'>): Promise<ScheduleItem | null> {
  const { data, error } = await supabase
    .from('schedule_items')
    .insert([scheduleData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating schedule item:', error);
    return null;
  }
  
  return data as ScheduleItem;
}

export async function getEventSchedule(eventId: string): Promise<ScheduleItem[]> {
  const { data, error } = await supabase
    .from('schedule_items')
    .select('*')
    .eq('event_id', eventId)
    .order('start_time', { ascending: true });
  
  if (error) {
    console.error('Error fetching event schedule:', error);
    return [];
  }
  
  return data as ScheduleItem[];
}

export async function updateScheduleItem(itemId: string, updateData: Partial<ScheduleItem>): Promise<ScheduleItem | null> {
  const { data, error } = await supabase
    .from('schedule_items')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating schedule item:', error);
    return null;
  }
  
  return data as ScheduleItem;
}

// Notification Functions
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  
  return data as Notification[];
}

export async function getEventAnnouncements(eventId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_announcement', true)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
  
  return data as Notification[];
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
  
  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
  
  return true;
}

export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  
  if (error) {
    console.error('Error marking all notifications as read:', error);
    return 0;
  }
  
  return data?.length || 0;
}

export async function createNotification(notificationData: Omit<Notification, 'id' | 'read' | 'created_at' | 'is_announcement'>): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{ 
      ...notificationData,
      read: false,
      is_announcement: false
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }
  
  return data as Notification;
}

export async function createAnnouncement(announcementData: Omit<Notification, 'id' | 'read' | 'created_at' | 'is_announcement' | 'user_id'>): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{ 
      ...announcementData,
      read: false,
      is_announcement: true
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating announcement:', error);
    return null;
  }
  
  return data as Notification;
}

// Volunteer Functions
export async function registerVolunteer(volunteerData: Omit<Volunteer, 'id' | 'created_at' | 'updated_at' | 'hours_worked'>): Promise<Volunteer | null> {
  const { data, error } = await supabase
    .from('volunteers')
    .insert([{ 
      ...volunteerData,
      hours_worked: 0
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error registering volunteer:', error);
    return null;
  }
  
  return data as Volunteer;
}

export async function getEventVolunteers(eventId: string): Promise<Volunteer[]> {
  const { data, error } = await supabase
    .from('volunteers')
    .select('*, users(full_name, email)')
    .eq('event_id', eventId);
  
  if (error) {
    console.error('Error fetching event volunteers:', error);
    return [];
  }
  
  return data as any;
}

export async function updateVolunteerStatus(volunteerId: string, status: Volunteer['status'], hoursWorked?: number): Promise<Volunteer | null> {
  const updateData: any = { 
    status,
    updated_at: new Date().toISOString()
  };
  
  if (hoursWorked !== undefined) {
    updateData.hours_worked = hoursWorked;
  }
  
  const { data, error } = await supabase
    .from('volunteers')
    .update(updateData)
    .eq('id', volunteerId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating volunteer status:', error);
    return null;
  }
  
  return data as Volunteer;
}

// Report Functions
export async function createReportTemplate(templateData: Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ReportTemplate | null> {
  const { data, error } = await supabase
    .from('report_templates')
    .insert([templateData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating report template:', error);
    return null;
  }
  
  return data as ReportTemplate;
}

export async function getReportTemplates(): Promise<ReportTemplate[]> {
  const { data, error } = await supabase
    .from('report_templates')
    .select('*');
  
  if (error) {
    console.error('Error fetching report templates:', error);
    return [];
  }
  
  return data as ReportTemplate[];
}

export async function generateReport(reportData: Omit<GeneratedReport, 'id' | 'created_at' | 'file_url'>): Promise<GeneratedReport | null> {
  const { data, error } = await supabase
    .from('generated_reports')
    .insert([reportData])
    .select()
    .single();
  
  if (error) {
    console.error('Error generating report:', error);
    return null;
  }
  
  return data as GeneratedReport;
}

export async function getEventReports(eventId: string): Promise<GeneratedReport[]> {
  const { data, error } = await supabase
    .from('generated_reports')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching event reports:', error);
    return [];
  }
  
  return data as GeneratedReport[];
}
