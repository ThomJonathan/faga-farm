import { NextResponse } from 'next/server';
import auth from '../../../../lib/auth';

export async function POST(request) {
  try {
    const contentType = (request.headers.get('content-type') || '').toLowerCase();
    let body = {};

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      body = Object.fromEntries(params.entries());
    } else {
      try {
        body = await request.json();
      } catch (e) {
        const text = await request.text();
        const params = new URLSearchParams(text);
        body = Object.fromEntries(params.entries());
      }
    }

    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    const user = await auth.authenticateUser(username, password);

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { message: 'Account is inactive' },
        { status: 403 }
      );
    }

    // determine redirect path by role
    const role = user.role;
    let redirectPath = '/';
    switch (role) {
      case 'admin':
      case 'manager':
        redirectPath = '/manager/dashboard';
        break;
      case 'sales_person':
        redirectPath = '/sales-person/dashboard';
        break;
      case 'farm_worker':
        redirectPath = '/farm-worker/dashboard';
        break;
      default:
        redirectPath = '/';
    }

    // If the request expects HTML (native form submit), redirect to dashboard
    const accept = (request.headers.get('accept') || '').toLowerCase();
    const isHtmlRequest = accept.includes('text/html') || contentType.includes('application/x-www-form-urlencoded');

    if (isHtmlRequest) {
      const redirectUrl = new URL(redirectPath, request.url);
      return NextResponse.redirect(redirectUrl, 303);
    }

    // For fetch/JS clients return JSON with user info
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
