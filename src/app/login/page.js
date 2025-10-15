'use client';

import { useSearchParams } from 'next/navigation';
import LoginForm from '../../components/LoginForm';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  return (
    <div>
      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-center">
          {message}
        </div>
      )}
      <LoginForm />
    </div>
  );
}
