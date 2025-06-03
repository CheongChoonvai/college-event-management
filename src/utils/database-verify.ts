import { supabase } from '@/lib/supabase';

// Function to verify the database connection and events table
export async function verifyEventsTable() {
  try {
    console.log("Verifying database connection and events table...");
    
    // Check database connection by getting the server version
    const { data: versionData, error: versionError } = await supabase
      .rpc('version');
    
    if (versionError) {
      console.error("Database connection error:", versionError);
      return {
        connected: false,
        error: versionError,
        message: "Cannot connect to the database"
      };
    }
    
    console.log("Database connected:", versionData);
    
    // Check if the events table exists by querying it
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('count()')
      .limit(1);
    
    if (eventsError) {
      console.error("Events table error:", eventsError);
      return {
        connected: true,
        eventsTableAccessible: false,
        error: eventsError,
        message: "Cannot access the events table"
      };
    }
    
    // Check the organizer_id column by attempting to filter by it
    const { error: organizerError } = await supabase
      .from('events')
      .select('id')
      .eq('organizer_id', 'test')
      .limit(1);
    
    if (organizerError && organizerError.message?.includes('column')) {
      console.error("organizer_id column error:", organizerError);
      return {
        connected: true,
        eventsTableAccessible: true,
        organizerIdColumn: false,
        error: organizerError,
        message: "The organizer_id column might not exist or has a different name"
      };
    }
    
    console.log("Events table verification complete - all good");
    return {
      connected: true,
      eventsTableAccessible: true,
      organizerIdColumn: true,
      message: "Database and events table verified successfully"
    };
  } catch (error) {
    console.error("Verification error:", error);
    return {
      connected: false,
      error,
      message: "An exception occurred during verification"
    };
  }
}

// Call this function in the browser console to help debug:
// import { verifyEventsTable } from '@/utils/database-verify';
// verifyEventsTable().then(console.log);
