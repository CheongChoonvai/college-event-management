// Fix for the Error fetching events: {} issue
// This is likely a permissions issue with the database or a missing table

import { supabase } from '@/lib/supabase';

// Check if events table exists and has proper structure
export async function debugEventsTable() {
  try {
    // First try to get the schema of the events table
    console.log("Checking events table schema...");
    const { data: tableInfo, error: tableError } = await supabase
      .from('events')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error("Error accessing events table:", tableError);
      
      // Try to see if the table exists at all
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_tables');
      
      if (tablesError) {
        console.error("Error getting tables list:", tablesError);
        return { success: false, message: "Cannot access database schema", error: tablesError };
      }
      
      console.log("Available tables:", tables);
      
      if (!tables || !tables.includes('events')) {
        return { 
          success: false, 
          message: "Events table does not exist. Please run the SQL scripts to create it.", 
          error: tableError 
        };
      }
      
      return { 
        success: false, 
        message: "Events table exists but cannot be accessed. Check permissions.", 
        error: tableError 
      };
    }
    
    console.log("Events table structure:", tableInfo);
    return { success: true, message: "Events table exists and is accessible" };
  } catch (error) {
    console.error("Exception during debug:", error);
    return { success: false, message: "Exception occurred", error };
  }
}

// Helper function to safely fetch events with better error handling
export async function getSafeEvents(options = {}) {
  try {
    console.log("getSafeEvents called with options:", options);
    
    let query = supabase.from('events').select('*');
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.category) {
      query = query.eq('category', options.category);
    }
    
    if (options.status) {
      query = query.eq('status', options.status);
    }
    
    if (options.organizerId) {
      query = query.eq('organizer_id', options.organizerId);
    }
    
    // Explicitly log the query being executed
    console.log("Executing query on 'events' table...");
    
    const { data, error } = await query;
    
    if (error) {
      // Enhanced error logging with full error object serialization
      console.error("Error fetching events:", JSON.stringify(error, null, 2));
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        status: error.status
      });
      
      // Try to debug the issue
      const debugResult = await debugEventsTable();
      console.log("Debug result:", debugResult);
      
      return { success: false, error, data: [], debugResult };
    }
    
    console.log(`Successfully fetched ${data?.length || 0} events.`);
    return { success: true, data };
  } catch (e) {
    console.error("Exception fetching events:", e);
    console.error('Exception stack:', e instanceof Error ? e.stack : 'No stack available');
    return { success: false, error: e, data: [] };
  }
}
