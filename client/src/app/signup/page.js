"use client";
import { useState } from 'react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Signup failed');
      setMessage('Account created. You can now log in.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-sky-50 px-6">
      <div className="card w-full max-w-md p-8">
        <h1 className="mb-2 text-2xl font-bold text-black dark:text-white">Sign up</h1>
        <p className="mb-6 text-sm text-black dark:text-white">Create your AiSocial account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">Username</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">Password</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary w-full" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
        </form>
        <div className="mt-4 text-sm text-black dark:text-white">
          Already have an account? <Link className="text-sky-600" href="/login">Log in</Link>
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
      </div>
    </div>
  );
}
