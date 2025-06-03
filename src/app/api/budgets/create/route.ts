import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/utils/auth';
import { z } from 'zod';

const budgetItemSchema = z.object({
  event_id: z.string().uuid('Invalid event ID format'),
  item_name: z.string().min(3, 'Item name must be at least 3 characters'),
  category: z.enum(['venue', 'catering', 'marketing', 'equipment', 'staff', 'other']),
  estimated_cost: z.number().nonnegative('Estimated cost cannot be negative'),
  actual_cost: z.number().nonnegative('Actual cost cannot be negative').optional(),
  status: z.enum(['planned', 'approved', 'spent', 'cancelled']),
  notes: z.string().optional(),
});

// Create budget item
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

    const body = await request.json();
    
    // Parse string values to numbers
    const parsedBody = {
      ...body,
      estimated_cost: parseFloat(body.estimated_cost) || 0,
      actual_cost: body.actual_cost ? parseFloat(body.actual_cost) : undefined,
    };

    // Validate the request body
    const validatedData = budgetItemSchema.parse(parsedBody);
    
    // Verify the user is the event organizer or an admin
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', validatedData.event_id)
      .single();

    if (eventError) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (eventData.organizer_id !== currentUser.id && currentUser.user_role !== 'admin') {
      return NextResponse.json(
        { error: 'You do not have permission to manage this event budget' },
        { status: 403 }
      );
    }

    // Create the budget item
    const { data, error } = await supabase
      .from('budgets')
      .insert({
        event_id: validatedData.event_id,
        item_name: validatedData.item_name,
        category: validatedData.category,
        estimated_cost: validatedData.estimated_cost,
        actual_cost: validatedData.actual_cost,
        status: validatedData.status,
        notes: validatedData.notes
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
        message: 'Budget item created successfully',
        item: data 
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
      { error: 'Failed to create budget item' },
      { status: 500 }
    );
  }
}
