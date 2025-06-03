import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/utils/auth';
import { use } from 'react';

// Get event budgets
export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    // Use React.use() to unwrap the params Promise
    const eventId = params.eventId;
    
    // Verify the user is authenticated
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the user is the event organizer or an admin
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single();

    if (eventError) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (eventData.organizer_id !== currentUser.id && currentUser.user_role !== 'admin') {
      return NextResponse.json(
        { error: 'You do not have permission to access this event budget' },
        { status: 403 }
      );
    }

    // Get all budget items for the event
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Calculate budget summary
    const totalEstimatedCost = data.reduce(
      (sum, item) => sum + (item.estimated_cost || 0),
      0
    );
    
    const totalActualCost = data.reduce(
      (sum, item) => sum + (item.actual_cost || 0),
      0
    );
    
    const budgetByCategory = data.reduce((acc: any, item) => {
      if (!acc[item.category]) {
        acc[item.category] = {
          estimated: 0,
          actual: 0,
        };
      }
      
      acc[item.category].estimated += (item.estimated_cost || 0);
      acc[item.category].actual += (item.actual_cost || 0);
      return acc;
    }, {});

    return NextResponse.json({
      items: data,
      summary: {
        totalEstimatedCost,
        totalActualCost,
        budgetByCategory,
      },
    });
  } catch (error) {
    console.error('Error fetching budget items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget items' },
      { status: 500 }
    );
  }
}
