import { supabase } from '@/lib/supabase';
import { Event, Registration, User, Budget, Sponsor, Sponsorship, Venue, Notification } from '@/types/database.types';

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
  try {
    // Log the data being sent to help debug
    console.log('Creating event with data:', JSON.stringify(eventData, null, 2));
    
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating event:', JSON.stringify(error, null, 2));
      return null;
    }
    
    return data as Event;
  } catch (err) {
    console.error('Exception during event creation:', err);
    return null;
  }
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
    query = query.eq('organizer_id', options.organizerId);
  }
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
    
  try {
    const { data, error } = await query.order('start_date', { ascending: true });
    
    if (error) {
      // Enhance error logging with more details
      console.error('Error fetching events:', JSON.stringify(error));
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        status: error.status
      });
      
      return [];
    }
    
    return data as Event[] || [];
  } catch (e) {
    console.error('Exception in getEvents:', e);
    console.error('Exception stack:', e instanceof Error ? e.stack : 'No stack available');
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

export async function getUserEventRegistrations(userId: string, eventId: string) {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('user_id', userId)
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching user event registrations:', error);
    return [];
  }

  return data;
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
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*, events(*)')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user registrations:', JSON.stringify(error, null, 2));
      return [];
    }
    
    // Debug log to check the structure of returned data
    console.log('User registrations data:', JSON.stringify(data && data.length > 0 ? data[0] : 'No registrations', null, 2));
    
    return data as Registration[];
  } catch (err) {
    console.error('Exception during getUserRegistrations:', err);
    return [];
  }
}

// Budget Functions
export async function createBudgetItem(budgetData: Partial<Budget>): Promise<Budget | null> {
  const { data, error } = await supabase
    .from('budgets')
    .insert([budgetData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating budget item:', error);
    return null;
  }
  
  return data as Budget;
}

export async function getEventBudget(eventId: string): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching event budget:', error);
    return [];
  }
  
  return data as Budget[];
}

export async function updateBudgetItem(itemId: string, updateData: Partial<Budget>): Promise<Budget | null> {
  const { data, error } = await supabase
    .from('budgets')
    .update(updateData)
    .eq('id', itemId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating budget item:', error);
    return null;
  }
  
  return data as Budget;
}

export async function deleteBudgetItem(itemId: string): Promise<boolean> {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', itemId);
  
  if (error) {
    console.error('Error deleting budget item:', error);
    return false;
  }
  
  return true;
}

export async function getBudgetSummary(eventId: string) {
  const budget = await getEventBudget(eventId);
  
  const totalEstimatedCost = budget.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
  const totalActualCost = budget.reduce((sum, item) => sum + (item.actual_cost || 0), 0);
  
  const byCategory = budget.reduce((acc: any, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { estimated: 0, actual: 0 };
    }
    
    acc[item.category].estimated += (item.estimated_cost || 0);
    acc[item.category].actual += (item.actual_cost || 0);
    return acc;
  }, {});
  
  return { totalEstimatedCost, totalActualCost, byCategory };
}

// Notification Functions
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching user notifications:', error);
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
    .eq('read', false)
    .select();
  
  if (error) {
    console.error('Error marking all notifications as read:', error);
    return 0;
  }
  
  return data.length;
}

export async function createNotification(notificationData: Omit<Notification, 'id' | 'read' | 'created_at'>): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      ...notificationData,
      read: false,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }
  
  return data as Notification;
}
