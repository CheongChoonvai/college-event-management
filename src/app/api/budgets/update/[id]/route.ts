import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/utils/auth';

// Update budget item
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Verify the user is authenticated
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Parse string values to numbers if they exist
    if (body.estimated_cost) {
      body.estimated_cost = parseFloat(body.estimated_cost);
    }
    
    if (body.actual_cost) {
      body.actual_cost = parseFloat(body.actual_cost);
    }

    // Get the budget item to check permissions
    const { data: budgetItem, error: fetchError } = await supabase
      .from('budgets')
      .select('*, events(organizer_id)')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Budget item not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this budget item
    const organizerId = budgetItem.events?.organizer_id;
    if (organizerId !== currentUser.id && currentUser.user_role !== 'admin') {
      return NextResponse.json(
        { error: 'You do not have permission to update this budget item' },
        { status: 403 }
      );
    }

    // Update the budget item
    const { data, error } = await supabase
      .from('budgets')
      .update({
        item_name: body.item_name || budgetItem.item_name,
        category: body.category || budgetItem.category,
        estimated_cost: body.estimated_cost !== undefined ? body.estimated_cost : budgetItem.estimated_cost,
        actual_cost: body.actual_cost !== undefined ? body.actual_cost : budgetItem.actual_cost,
        status: body.status || budgetItem.status,
        notes: body.notes !== undefined ? body.notes : budgetItem.notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Create a notification if the actual cost was updated
    if (body.actual_cost !== undefined && body.actual_cost !== budgetItem.actual_cost) {
      await supabase
        .from('notifications')
        .insert({
          user_id: currentUser.id,
          title: 'Budget Updated',
          message: `Actual cost for "${budgetItem.item_name}" has been updated to $${body.actual_cost}`,
          type: 'info',
          read: false,
          created_at: new Date().toISOString()
        });
    }

    return NextResponse.json({
      message: 'Budget item updated successfully',
      item: data
    });
  } catch (error) {
    console.error('Error updating budget item:', error);
    return NextResponse.json(
      { error: 'Failed to update budget item' },
      { status: 500 }
    );
  }
}
