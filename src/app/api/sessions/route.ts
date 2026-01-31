import { NextResponse } from "next/server";

// NOTE: Prisma/SQLite doesn't work on Vercel serverless environment
// All data is stored in localStorage on the client side
// These endpoints are kept for backward compatibility but don't persist to database

// GET - Load the latest session or all sessions
export async function GET() {
  try {
    // Sessions are stored in localStorage on client side
    return NextResponse.json({ session: null });
  } catch (error) {
    console.error('Error loading sessions:', error);
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
  }
}

// POST - Save current session
export async function POST(request: Request) {
  try {
    await request.json(); // Parse body to avoid warnings
    
    // Sessions are stored in localStorage on client side
    // Return success to avoid errors in the UI
    return NextResponse.json({ 
      success: true, 
      sessionId: `session-${Date.now()}` 
    });
  } catch (error) {
    console.error('Error saving session:', error);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}
