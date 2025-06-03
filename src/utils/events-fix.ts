// Enhanced getEvents function with better error handling

import { supabase } from '@/lib/supabase';
import { Event } from '@/types/database.types';

export async function getEvents(options: { 
  limit?: number, 
  category?: string,
  status?: Event['status'],
  organizerId?: string
} = {}): Promise<Event[]> {
  try {
    console.log("getEvents called with options:", options);
    
    // Check if events table exists (debug mode)
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables')
      .limit(20);
      
    if (!tablesError && tables) {
      console.log("Available tables:", tables);
    }
    
    // Build query
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
    
    // Execute query
    const { data, error } = await query.order('start_date', { ascending: true });
    
    if (error) {
      // Provide more detailed logging of the error object
      console.error('Error fetching events:', JSON.stringify(error));
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        status: error.status
      });
      
      // If error is a permissions issue
      if (error.code === 'PGRST301' || error.code === '42501') {
        console.error('This is likely a permissions issue. Check RLS policies for the events table.');
      }
      
      // If error is a schema issue
      if (error.code === '42P01') {
        console.error('The events table does not exist. Make sure to run the SQL setup scripts.');
      }
      
      return [];
    }
    
    console.log(`Successfully fetched ${data?.length || 0} events.`);
    return data as Event[] || [];
  } catch (e) {
    // Log the full exception and its stack trace
    console.error('Exception in getEvents:', e);
    console.error('Exception stack:', e instanceof Error ? e.stack : 'No stack available');
    return [];
  }
}
