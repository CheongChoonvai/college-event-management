import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { eventSchema } from '@/utils/validations';
import { z } from 'zod';
import { getCurrentUser } from '@/utils/auth';

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

    // Check if user is an organizer or admin
    if (currentUser.user_role !== 'organizer' && currentUser.user_role !== 'admin') {
      return NextResponse.json(
        { error: 'Only organizers and admins can create events' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Convert strings to numbers where needed
    const validationData = {
      ...body,
      capacity: parseInt(body.capacity) || 0,
      price: parseFloat(body.price) || 0,
    };
    
    // Validate the request body
    const validatedData = eventSchema.parse(validationData);
    
    // Create the event
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        location: validatedData.location,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date,
        capacity: validatedData.capacity,
        price: validatedData.price,
        category: validatedData.category,
        image_url: body.image_url || null,
        organizer_id: currentUser.id,
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    // Create a notification for the organizer
    await supabase
      .from('notifications')
      .insert({
        user_id: currentUser.id,
        title: 'Event Created',
        message: `Your event "${validatedData.title}" has been created successfully.`,
        type: 'success',
        read: false,
        created_at: new Date().toISOString()
      });

    return NextResponse.json(
      { 
        message: 'Event created successfully',
        event: data 
      }, 
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
