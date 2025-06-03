import { supabase } from '@/lib/supabase';
import { User } from '@/types/database.types';

export async function signUp(email: string, password: string, fullName: string, role: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        user_role: role
      }
    }
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signIn(email: string, password: string) {
  // First, use Supabase client for authentication
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error('Supabase auth error:', authError);
    throw authError;
  }

  try {
    // Then call the API to ensure cookies are set for server-side
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      // Even if API call fails, authentication might have succeeded
      console.warn(`API login warning: HTTP ${response.status}`);
      return authData;
    }

    const data = await response.json();
    return data;
  } catch (apiError) {
    // If API call fails but auth succeeded, just return auth data
    console.warn('API login warning:', apiError);
    return authData;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
  
  return true;
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function getCurrentUser() {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      return null;
    }
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionData.session.user.id)
      .single();
    
    if (error || !userData) {
      console.error('Error fetching user data:', error);
      return null;
    }
    
    return userData as unknown as User;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export function requireAuth() {
  return getCurrentUser().then(user => {
    if (!user) {
      // Redirect to login if user is not authenticated
      window.location.href = '/login';
      return null;
    }
    return user;
  });
}

export function requireRole(allowedRoles: string[]) {
  return getCurrentUser().then(user => {
    if (!user) {
      // Redirect to login if user is not authenticated
      window.location.href = '/login';
      return null;
    }
    
    if (!allowedRoles.includes(user.user_role)) {
      // Redirect to dashboard if user doesn't have required role
      window.location.href = '/dashboard';
      return null;
    }
    
    return user;
  });
}
