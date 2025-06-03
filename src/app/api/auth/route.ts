import { NextResponse } from 'next/server';

// Ensure route is always dynamic and not cached
export const dynamic = 'force-dynamic';

export function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    },
  });
}

// Add this function to respond to GET requests that might be misrouted
export function GET() {
  return NextResponse.json(
    { message: 'Auth API is working. Use /api/auth/login for authentication.' },
    { status: 200 }
  );
}
