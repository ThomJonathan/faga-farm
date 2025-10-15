import { NextResponse } from 'next/server';
// use default import to match CommonJS export from lib/auth
import auth from '../../../../lib/auth';

export async function POST(request) {
  try {
    const contentType = (request.headers.get('content-type') || '').toLowerCase();
    let body = {};

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // parse fallback form submissions
      const text = await request.text();
      const params = new URLSearchParams(text);
      body = Object.fromEntries(params.entries());
    } else {
      // try JSON as a last resort
      try {
        body = await request.json();
      } catch (e) {
        const text = await request.text();
        const params = new URLSearchParams(text);
        body = Object.fromEntries(params.entries());
      }
    }

    const { name, username, password, email = null, phone = null, role = 'farm_worker' } = body;

    // Basic validation
    if (!name || !username || !password) {
      return NextResponse.json(
        { message: 'Name, username and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const exists = await auth.checkUsernameExists(username);
    if (exists) {
      return NextResponse.json(
        { message: 'Username already taken' },
        { status: 409 }
      );
    }

    // Create user
    const userId = await auth.createUser({ name, username, password, email, phone, role });

    // If the request expects HTML (native form submit), redirect to login page
    const accept = (request.headers.get('accept') || '').toLowerCase();
    const isHtmlRequest = accept.includes('text/html') || contentType.includes('application/x-www-form-urlencoded');

    if (isHtmlRequest) {
      const redirectUrl = new URL('/login?message=Account created successfully. Please log in.', request.url);
      return NextResponse.redirect(redirectUrl, 303);
    }

    // For fetch/JS clients return JSON so client-side code can redirect
    return NextResponse.json(
      { message: 'User created successfully', userId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    // If DB returns duplicate key error despite pre-check, handle defensively
    if (error && (error.code === 'ER_DUP_ENTRY' || error.errno === 1062)) {
      return NextResponse.json({ message: 'Username already taken' }, { status: 409 });
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
