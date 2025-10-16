import { NextResponse } from 'next/server';
import auth from '../../../../lib/auth';

export async function GET() {
  try {
    const user = await auth.getUserSession();
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
