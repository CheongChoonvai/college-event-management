import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';


export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Create Supabase client for auth
  const supabase = createMiddlewareClient({ req: request, res: response });
  
  // Refresh session if available
  await supabase.auth.getSession();
  
  return response;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ],
};
