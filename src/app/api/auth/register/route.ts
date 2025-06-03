import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { userSchema } from '@/utils/validations';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = userSchema.parse(body);
    
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          full_name: validatedData.full_name,
          user_role: validatedData.user_role
        }
      }
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }
    
    // Create additional user data in the users table
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user!.id,
        email: validatedData.email,
        full_name: validatedData.full_name,
        user_role: validatedData.user_role,
        created_at: new Date().toISOString()
      });

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        userId: authData.user?.id 
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
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
