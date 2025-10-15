import { NextResponse } from 'next/server';
import auth from '../../../../lib/auth';

export async function POST(request) {
  try {
    // Clear the user session
    await auth.clearUserSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
