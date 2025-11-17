"use client";
import { useEffect, useState } from 'react';
import { apiGet, apiPatch } from '@/lib/api';

export default function ProfilePage() {
  const [me, setMe] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [coverPhoto, setCoverPhoto] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { user } = await apiGet('/api/users/me');
        setMe(user);
        setDisplayName(user.displayName || '');
        setBio(user.bio || '');
        setWebsite(user.website || '');
        setProfilePic(user.profilePic || '');
        setCoverPhoto(user.coverPhoto || '');
        setCity(user.city || '');
        setCountry(user.country || '');
      } catch (e) {
        setErr('Not signed in');
      }
    })();
  }, []);

  async function save() {
    setLoading(true); setErr(''); setMsg('');
    try {
      const { user } = await apiPatch('/api/users/me', { displayName, website, bio, profilePic, coverPhoto, city, country });
      setMe(user);
      setMsg('Profile updated');
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">Your Profile</h1>
      {err && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      {msg && <div className="mb-4 rounded bg-green-50 p-3 text-sm text-green-700">{msg}</div>}
      <div className="space-y-4 rounded border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Display name</label>
          <input className="w-full rounded border border-gray-300 p-2" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Bio</label>
          <textarea className="w-full rounded border border-gray-300 p-2" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Website</label>
          <input className="w-full rounded border border-gray-300 p-2" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Profile picture URL</label>
            <input className="w-full rounded border border-gray-300 p-2" value={profilePic} onChange={(e) => setProfilePic(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Cover photo URL</label>
            <input className="w-full rounded border border-gray-300 p-2" value={coverPhoto} onChange={(e) => setCoverPhoto(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">City</label>
            <input className="w-full rounded border border-gray-300 p-2" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Country</label>
            <input className="w-full rounded border border-gray-300 p-2" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>
        <button onClick={save} disabled={loading} className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 disabled:opacity-70">Save</button>
      </div>

      {/* 2FA removed: Google-only login */}
    </div>
  );
}
