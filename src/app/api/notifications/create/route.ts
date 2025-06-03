import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/utils/auth';

// Create a notification
export async function POST(request: Request) {
  try {
    // Verify the user is authenticated
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin or organizer
    if (currentUser.user_role !== 'admin' && currentUser.user_role !== 'organizer') {
      return NextResponse.json(
        { error: 'Only admins and organizers can send notifications' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.user_id || !body.title || !body.message || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, title, message, and type are required' },
        { status: 400 }
      );
    }
    
    // Validate notification type
    const validTypes = ['info', 'warning', 'success', 'error'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid notification type. Must be one of: info, warning, success, error' },
        { status: 400 }
      );
    }
    
    // Create the notification
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: body.user_id,
        title: body.title,
        message: body.message,
        type: body.type,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Notification sent successfully',
        notification: data 
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
