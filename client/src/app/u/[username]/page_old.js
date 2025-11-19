"use client";
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { apiGet, apiPost, apiPatch, API_BASE, authHeaders } from '@/lib/api';
import { uploadImageToCloudinary, dataUrlToFile } from '@/lib/upload';
import Navbar from '@/components/Navbar';

// Utility functions
function timeAgo(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dys = Math.floor(h / 24);
  if (dys < 7) return `${dys}d ago`;
  const w = Math.floor(dys / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(dys / 30);
  if (mo < 12) return `${mo}mo ago`;
  const y = Math.floor(dys / 365);
  return `${y}y ago`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Post Card Component
function PostCard({ post, onPostUpdated }) {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 mb-4">
      <header className="flex items-center gap-3 px-4 py-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
          {post.user?.username?.[0]?.toUpperCase() || '👤'}
        </div>
        <div className="leading-tight flex-1">
          <div className="text-sm font-semibold dark:text-white">
            {post.user?.username || 'User'}
            <span className="ml-2 align-middle text-xs font-normal text-gray-500 dark:text-gray-400">
              {timeAgo(post.createdAt)}
            </span>
          </div>
        </div>
        {post.canDelete && (
          <button
            onClick={async () => {
              const next = typeof window !== 'undefined' ? window.prompt('Edit caption', post.caption || '') : null;
              if (next === null) return;
              try {
                const res = await fetch(`${API_BASE}/api/posts/${post._id}`, { 
                  method: 'PATCH', 
                  headers: { 'Content-Type': 'application/json', ...authHeaders() }, 
                  body: JSON.stringify({ caption: next }) 
                });
                const data = await res.json();
                if (res.ok) onPostUpdated?.(data.post);
              } catch {}
            }}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            Edit
          </button>
        )}
      </header>
      
      {post.caption && (
        <div className="px-4 pb-3 text-sm dark:text-gray-200">{post.caption}</div>
      )}
      
      {post.media?.[0]?.url && (
        <div className="bg-gray-100 dark:bg-gray-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={post.media[0].url} 
            alt="" 
            className="max-h-[640px] w-full object-cover" 
          />
        </div>
      )}
      
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        {post.pinned && (
          <div className="mb-2 inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-300">
            📌 Pinned
          </div>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span>❤️</span>
            <span className="font-medium">{post.likes || 0}</span>
          </span>
          <span className="flex items-center gap-1">
            <span>💬</span>
            <span className="font-medium">{post.commentsCount || 0}</span>
          </span>
        </div>
      </div>
    </article>
  );
}

export default function UserProfile() {
  const { username } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [feed, setFeed] = useState([]);
  const [reels, setReels] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [tagged, setTagged] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendTotal, setFriendTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const coverInputRef = useRef(null);
  const profileInputRef = useRef(null);
  const [outgoingReqs, setOutgoingReqs] = useState([]);
  const [incomingReqs, setIncomingReqs] = useState([]);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [avatarFrameOn, setAvatarFrameOn] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [viewerSrc, setViewerSrc] = useState('');
  const [captionEditorOpen, setCaptionEditorOpen] = useState(false);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState('');
  const [avatarCaption, setAvatarCaption] = useState('Updated profile picture');
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [cropSrc, setCropSrc] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  // removed unused refs

  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      setErr('');
      try {
        const [{ profile: p }, { posts }, { users: fols }, { users: fing }, frs, reqs] = await Promise.all([
          apiGet(`/api/users/profile/${username}`),
          apiGet(`/api/posts/user/${username}?type=post&limit=60`),
          apiGet(`/api/users/${username}/followers`),
          apiGet(`/api/users/${username}/following`),
          apiGet(`/api/users/${username}/friends`).catch(()=>({ users: [], total: 0 })),
          apiGet(`/api/users/me/friend-requests`).catch(()=>({ incoming: [], outgoing: [] })),
        ]);
        setProfile(p);
        setFeed(posts);
        setFollowers(fols);
        setFollowing(fing);
        setFriends(frs.users || []);
        setFriendTotal(frs.total || (frs.users || []).length);
        setIncomingReqs(reqs.incoming || []);
        setOutgoingReqs(reqs.outgoing || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  useEffect(() => {
    (async () => {
      try {
        const { posts: r } = await apiGet(`/api/posts/user/${username}?type=reel&limit=60`);
        setReels(r);
      } catch {}
    })();
  }, [username]);

  const activeTab = (searchParams?.get('tab') || 'posts').toLowerCase();
  const setTab = (t) => router.replace(`/u/${username}?tab=${t}`);

  async function toggleFollow() {
    if (!profile) return;
    try {
      if (profile.isFollowing) {
        await apiPost(`/api/users/${profile.id}/unfollow`);
        setProfile({ ...profile, isFollowing: false, counts: { ...profile.counts, followers: Math.max(0, profile.counts.followers - 1) } });
      } else {
        await apiPost(`/api/users/${profile.id}/follow`);
        setProfile({ ...profile, isFollowing: true, counts: { ...profile.counts, followers: profile.counts.followers + 1 } });
      }
    } catch (e) {
      setErr(e.message);
    }
  }

  async function uploadAvatar() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          setCropSrc(reader.result);
          setZoom(1);
          setCrop({ x: 0, y: 0 });
          setShowCropper(true);
        };
        reader.readAsDataURL(file);
      };
      input.click();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function saveAvatarWithCaption() {
    if (!pendingAvatarUrl) return;
    setSavingAvatar(true);
    try {
      const file = dataUrlToFile(pendingAvatarUrl, 'avatar.png');
      const uploaded = await uploadImageToCloudinary(file, 'aisocial/profile');
      await apiPatch('/api/users/me', { profilePic: uploaded.url });
      setProfile((prev) => (prev ? { ...prev, profilePic: uploaded.url } : prev));
      const { post } = await apiPost('/api/posts', {
        media: [{ url: uploaded.url }],
        caption: avatarCaption?.trim() ? avatarCaption.trim() : undefined,
        albumName: 'Profile Pictures',
      });
      setFeed((prev) => [post, ...prev]);
      setCaptionEditorOpen(false);
      setPendingAvatarUrl('');
      setAvatarCaption('Updated profile picture');
    } catch (e) {
      setErr(e.message || 'Failed to update avatar');
    } finally {
      setSavingAvatar(false);
    }
  }

  async function getCroppedDataUrl(imageSrc, cropPixels) {
    const image = document.createElement('img');
    image.src = imageSrc;
    await new Promise((res) => { image.onload = res; });
    const canvas = document.createElement('canvas');
    const size = Math.max(cropPixels.width, cropPixels.height);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      cropPixels.x,
      cropPixels.y,
      cropPixels.width,
      cropPixels.height,
      0,
      0,
      size,
      size
    );
    // Draw circular mask (avatar)
    const output = document.createElement('canvas');
    output.width = size;
    output.height = size;
    const octx = output.getContext('2d');
    octx.beginPath();
    octx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    octx.closePath();
    octx.clip();
    octx.drawImage(canvas, 0, 0);
    return output.toDataURL('image/png');
  }

  async function uploadCover() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const uploaded = await uploadImageToCloudinary(file, 'aisocial/cover');
        const { user } = await apiPatch('/api/users/me', { coverPhoto: uploaded.url });
        setProfile((prev) => prev ? { ...prev, coverPhoto: uploaded.url } : prev);
        try {
          await apiPost('/api/posts', { media: [{ url: uploaded.url }], caption: 'Updated cover photo', albumName: 'Cover Photos' });
        } catch {}
      };
      input.click();
    } catch (e) {
      setErr(e.message);
    }
  }

  if (loading) return <div className="p-8">Loading…</div>;
  if (err) return <div className="p-8 text-red-600">{err}</div>;
  if (!profile) return <div className="p-8">Not found</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-6">
      {/* Instagram-style header */}
      <div className="grid grid-cols-3 items-center gap-8">
        <div className="flex justify-center">
          <div className={`relative h-28 w-28 overflow-hidden rounded-full border-4 ${avatarFrameOn ? 'border-fuchsia-500' : 'border-white'} bg-gray-300`}>
            {profile.profilePic ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profilePic}
                alt="avatar"
                className="h-full w-full cursor-pointer object-cover"
                onClick={() => {
                  if (!profile.isMe) { setViewerSrc(profile.profilePic); setShowViewer(true); return; }
                  setAvatarMenuOpen((v) => !v);
                }}
              />
            ) : (
              profile.isMe ? <button onClick={uploadAvatar} className="btn btn-outline absolute inset-0">Add photo</button> : null
            )}
            {avatarMenuOpen && profile.isMe && (
              <div className="absolute left-1/2 top-full z-20 mt-2 w-44 -translate-x-1/2 overflow-hidden rounded-md border border-gray-200 bg-white shadow">
                <button onClick={() => { setAvatarMenuOpen(false); setViewerSrc(profile.profilePic); setShowViewer(true); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50">View photo</button>
                <button onClick={() => { setAvatarMenuOpen(false); uploadAvatar(); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50">Upload profile picture</button>
                <button onClick={() => { setAvatarMenuOpen(false); setAvatarFrameOn((v) => !v); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50">{avatarFrameOn ? 'Remove frame' : 'Add frame'}</button>
              </div>
            )}
          </div>
        </div>
        <div className="col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xl md:text-2xl">{profile.username}</div>
            {profile.isMe ? (
              <a href="/profile" className="btn btn-outline text-sm">Edit Profile</a>
            ) : (
              <>
                {/* Friend actions */}
                {!profile.areFriends && !profile.sentFriendRequest && !profile.receivedFriendRequest && (
                  <button className="btn btn-primary text-sm" onClick={async()=>{
                    try { await apiPost(`/api/users/${profile.id}/friend/request`); setProfile((p)=>({ ...p, sentFriendRequest: true })); } catch {}
                  }}>Add Friend</button>
                )}
                {profile.sentFriendRequest && (
                  <button className="btn btn-outline text-sm" onClick={async()=>{ try { await apiPost(`/api/users/${profile.id}/friend/cancel`); setProfile((p)=>({ ...p, sentFriendRequest: false })); } catch {} }}>Cancel Request</button>
                )}
                {profile.receivedFriendRequest && (
                  <>
                    <button className="btn btn-primary text-sm" onClick={async()=>{ try { await apiPost(`/api/users/${profile.id}/friend/accept`); setProfile((p)=>({ ...p, areFriends: true, receivedFriendRequest: false })); } catch {} }}>Confirm</button>
                    <button className="btn btn-outline text-sm" onClick={async()=>{ try { await apiPost(`/api/users/${profile.id}/friend/cancel`); setProfile((p)=>({ ...p, receivedFriendRequest: false })); } catch {} }}>Delete</button>
                  </>
                )}
                {profile.areFriends && (
                  <button className="btn btn-outline text-sm" onClick={async()=>{ try { await apiPost(`/api/users/${profile.id}/friend/remove`); setProfile((p)=>({ ...p, areFriends: false })); } catch {} }}>Friends ✓</button>
                )}
                {/* Follow toggler */}
                <button onClick={async () => {
                  try {
                    if (profile.isFollowing) {
                      await apiPost(`/api/users/${profile.id}/unfollow`);
                      setProfile((p) => ({ ...p, isFollowing: false }));
                    } else {
                      await apiPost(`/api/users/${profile.id}/follow`);
                      setProfile((p) => ({ ...p, isFollowing: true }));
                    }
                  } catch {}
                }} className={`btn text-sm ${profile.isFollowing ? 'btn-outline' : 'btn-primary'}`}>{profile.isFollowing ? 'Following' : 'Follow'}</button>
                <a href={`/messages?to=${profile.username}`} className="btn btn-outline text-sm">Message</a>
                <a href={`/call?to=${profile.username}`} className="btn btn-outline text-sm">Call</a>
                <details className="relative">
                  <summary className="btn btn-outline cursor-pointer list-none text-sm">•••</summary>
                  <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-black shadow">
                    <button className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50">Block</button>
                    <button className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50">Report</button>
                    <button className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50">Find Support</button>
                  </div>
                </details>
              </>
            )}
          </div>
          <div className="mt-4 flex gap-6">
            <Stat label="posts" value={profile.counts?.posts || 0} />
            <Stat label="followers" value={profile.counts?.followers || 0} />
            <Stat label="following" value={profile.counts?.following || 0} />
          </div>
          <div className="mt-4">
            <div className="font-semibold">{profile.displayName || profile.username}</div>
            {profile.bio && <div className="whitespace-pre-wrap text-sm">{profile.bio}</div>}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noreferrer" className="text-sm text-sky-600">
                {profile.website}
              </a>
            )}
          </div>
        </div>
      </div>
      {showViewer && viewerSrc && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowViewer(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={viewerSrc} alt="view" className="max-h-[80vh] w-auto" />
        </div>
      )}
      {showCropper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-white p-4 text-black shadow-lg dark:bg-black dark:text-white">
            <h3 className="mb-3 text-lg font-semibold">Crop profile picture</h3>
            <div className="relative h-72 w-full overflow-hidden rounded">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(croppedArea, croppedAreaPx) => setCroppedAreaPixels(croppedAreaPx)}
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="text-sm">Zoom</label>
              <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-outline" onClick={() => setShowCropper(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                if (!croppedAreaPixels) return;
                const dataUrl = await getCroppedDataUrl(cropSrc, croppedAreaPixels);
                // proceed to caption modal
                setShowCropper(false);
                setPendingAvatarUrl(dataUrl);
                setAvatarCaption('Updated profile picture');
                setCaptionEditorOpen(true);
              }}>Next</button>
            </div>
          </div>
        </div>
      )}
      {captionEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-white p-4 text-black shadow-lg dark:bg-black dark:text-white">
            <h3 className="mb-3 text-lg font-semibold">Post profile picture</h3>
            {pendingAvatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pendingAvatarUrl} alt="avatar preview" className="mb-3 max-h-60 w-full rounded object-cover" />
            )}
            <label className="mb-1 block text-sm">Caption</label>
            <textarea
              className="input mb-4 h-24"
              value={avatarCaption}
              onChange={(e) => setAvatarCaption(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button className="btn btn-outline" onClick={() => { setCaptionEditorOpen(false); setPendingAvatarUrl(''); }}>Cancel</button>
              <button className="btn btn-primary" disabled={savingAvatar} onClick={saveAvatarWithCaption}>{savingAvatar ? 'Posting…' : 'Save & Post'}</button>
            </div>
          </div>
        </div>
      )}
      {showViewer && viewerSrc && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowViewer(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={viewerSrc} alt="view" className="max-h-[80vh] w-auto" />
        </div>
      )}
      <div className="h-10" />

      {/* Navigation Tabs */}
      <div className="mt-6 border-t">
        <div className="flex flex-wrap justify-center gap-6 py-3 text-xs uppercase tracking-wide text-gray-500">
          {[
            ['posts','Posts'],
            ['about','About'],
            ['friends','Friends'],
            ['photos','Photos'],
            ['videos','Videos'],
            ['reels','Reels'],
            ['checkins','Check-ins'],
            ['life','Life Events'],
            ['likes','Likes'],
          ].map(([key,label]) => (
            <button key={key} onClick={() => setTab(key)} className={`pb-2 ${activeTab===key ? 'border-b-2 border-black text-black dark:border-white dark:text-white' : 'text-gray-400'}`}>{label}</button>
          ))}
        </div>
      </div>

      {/* Sections */}
      {activeTab === 'posts' && (
        <div className="mt-4">
          {/* Create Post Box (profile timeline) */}
          {profile.isMe && (
            <ProfileComposer onPosted={(post) => setFeed((prev) => [post, ...prev])} />
          )}
          {/* Timeline list */}
          <div className="mt-4">
            {feed.length === 0 && (
              <div className="rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-black dark:text-white">No posts yet.</div>
            )}
            {feed.map((p) => (
              <PostCard key={p._id || p.id} post={p} onPostUpdated={(np) => setFeed((prev) => prev.map((x) => (x._id === np._id ? { ...x, ...np } : x)))} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="card p-4">
            <h3 className="mb-2 text-base font-semibold">Overview</h3>
            <div className="space-y-1 text-sm">
              {profile.bio && <div>Bio: {profile.bio}</div>}
              {profile.nickname && <div>Nickname: {profile.nickname}</div>}
              {profile.gender && <div>Gender: {profile.gender}</div>}
              {profile.relationshipStatus && <div>Relationship: {profile.relationshipStatus}</div>}
            </div>
          </section>

          <section className="card p-4">
            <h3 className="mb-2 text-base font-semibold">Work and Education</h3>
            <div className="space-y-1 text-sm">
              {profile.work?.length ? profile.work.map((w, i) => (
                <div key={i}>Work: {w.role || '—'} at {w.company || '—'}</div>
              )) : <div>No work added</div>}
              {profile.education?.length ? profile.education.map((e, i) => (
                <div key={i}>Study: {e.degree || '—'} at {e.school || '—'}</div>
              )) : <div>No education added</div>}
            </div>
          </section>

          <section className="card p-4">
            <h3 className="mb-2 text-base font-semibold">Places Lived</h3>
            <div className="space-y-1 text-sm">
              {profile.currentCity && <div>Current city: {profile.currentCity}</div>}
              {profile.hometown && <div>Hometown: {profile.hometown}</div>}
            </div>
          </section>

          <section className="card p-4">
            <h3 className="mb-2 text-base font-semibold">Contact Info</h3>
            <div className="space-y-1 text-sm">
              <div>Email: {profile.username ? `${profile.username}@example.com` : '—'}</div>
              {profile.phone && <div>Phone: {profile.phone}</div>}
              {profile.website && (
                <div>Website: <a href={profile.website} className="text-sky-600" target="_blank" rel="noreferrer">{profile.website}</a></div>
              )}
              {profile.socialLinks?.map((s, i) => (
                <div key={i}>{s.label}: <a href={s.url} className="text-sky-600" target="_blank" rel="noreferrer">{s.url}</a></div>
              ))}
            </div>
          </section>

          <section className="card p-4">
            <h3 className="mb-2 text-base font-semibold">Basic Info</h3>
            <div className="space-y-1 text-sm text-black dark:text-white">
              <div>Birthday: {profile.birthday ? new Date(profile.birthday).toDateString() : '—'}</div>
              <div>Pronouns: {profile.pronouns || '—'}</div>
              <div>Languages: {profile.languages?.length ? profile.languages.join(', ') : '—'}</div>
            </div>
          </section>

          <section className="card p-4">
            <h3 className="mb-2 text-base font-semibold">Family and Relationships</h3>
            <div className="space-y-1 text-sm">
              {profile.family?.length ? profile.family.map((f, i) => (
                <div key={i}>{f.relation || '—'}: {f.name || '—'}</div>
              )) : <div>No family added</div>}
            </div>
          </section>

          <section className="card p-4">
            <h3 className="mb-2 text-base font-semibold">Details About You</h3>
            <div className="space-y-1 text-sm">
              {profile.favoriteQuotes && <div>Favorite quotes: “{profile.favoriteQuotes}”</div>}
              {profile.about && <div>About: {profile.about}</div>}
            </div>
          </section>

          <section className="card p-4 md:col-span-2">
            <h3 className="mb-2 text-base font-semibold">Life Events</h3>
            <div className="space-y-1 text-sm">
              {profile.lifeEvents?.length ? profile.lifeEvents.map((e, i) => (
                <div key={i}>{e.title} {e.date ? `— ${new Date(e.date).toDateString()}` : ''}</div>
              )) : <div>No life events yet</div>}
            </div>
          </section>

          {profile.isMe && (
            <section className="card p-4 md:col-span-2">
              <h3 className="mb-3 text-base font-semibold">Edit About</h3>
              <AboutEditor profile={profile} onSaved={(u) => setProfile((p) => ({ ...p, ...u }))} />
            </section>
          )}
        </div>
      )}

      {activeTab === 'friends' && (
        <div className="mt-4 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Friends · <span className="font-normal">{friendTotal}</span></h3>
          </div>
          {profile.isMe && (
            <section className="card p-4">
              <h4 className="mb-2 font-semibold">Friend Requests</h4>
              {incomingReqs.length === 0 && outgoingReqs.length === 0 && (
                <div className="text-sm text-gray-500">No pending requests</div>
              )}
              {incomingReqs.length > 0 && (
                <div className="mb-3">
                  <div className="mb-1 text-sm font-medium">Incoming</div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                    {incomingReqs.map((u) => (
                      <div key={u.id} className="card flex items-center gap-3 p-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200" />
                        <div className="truncate text-sm">{u.username}</div>
                        <div className="ml-auto flex gap-2">
                          <button className="btn btn-primary px-2 py-1 text-xs" onClick={async()=>{ await apiPost(`/api/users/${u.id}/friend/accept`); setIncomingReqs((arr)=>arr.filter(x=>x.id!==u.id)); }}>Confirm</button>
                          <button className="btn btn-outline px-2 py-1 text-xs" onClick={async()=>{ await apiPost(`/api/users/${u.id}/friend/cancel`); setIncomingReqs((arr)=>arr.filter(x=>x.id!==u.id)); }}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {outgoingReqs.length > 0 && (
                <div>
                  <div className="mb-1 text-sm font-medium">Sent</div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                    {outgoingReqs.map((u) => (
                      <div key={u.id} className="card flex items-center gap-3 p-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200" />
                        <div className="truncate text-sm">{u.username}</div>
                        <div className="ml-auto">
                          <button className="btn btn-outline px-2 py-1 text-xs" onClick={async()=>{ await apiPost(`/api/users/${u.id}/friend/cancel`); setOutgoingReqs((arr)=>arr.filter(x=>x.id!==u.id)); }}>Cancel</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <section>
            <div className="mb-2 text-sm text-gray-600">All Friends</div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {friends.map((u) => (
                <div key={u.id} className="card flex items-center gap-3 p-3">
                  <a href={`/u/${u.username}`} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div className="truncate text-sm">
                      <div className="truncate">{u.username}</div>
                      {typeof u.mutualCount === 'number' && <div className="text-xs text-gray-500">{u.mutualCount} mutual</div>}
                    </div>
                  </a>
                  {profile.isMe && (
                    <details className="ml-auto relative">
                      <summary className="btn btn-outline cursor-pointer list-none px-2 py-1 text-xs">Add to list</summary>
                      <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-md border border-gray-200 bg-white p-1 shadow">
                        {['close','family','restricted'].map((list)=> (
                          <button key={list} className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={async()=>{ await apiPost(`/api/users/${u.id}/friend/list`, { list, action: 'add' }); }}>
                          {list === 'close' ? 'Close Friends' : list === 'family' ? 'Family' : 'Restricted'}
                          </button>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'photos' && (
        <PhotosSection username={username} userId={profile.id} isMe={!!profile.isMe} />
      )}

      {activeTab === 'videos' && (
        <div className="mt-4 grid grid-cols-3 gap-1 md:gap-6">
          {reels.length === 0 && (
            <div className="col-span-3 rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-black dark:text-white">No videos yet.</div>
          )}
          {reels.map((p) => (
            <div key={p._id || p.id} className="relative aspect-square overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.media?.[0]?.url && <img src={p.media[0].url} alt="video" className="h-full w-full object-cover" />}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'reels' && (
        <div className="mt-4 grid grid-cols-3 gap-1 md:gap-6">
          {reels.length === 0 && (
            <div className="col-span-3 rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-black dark:text-white">No reels yet.</div>
          )}
          {reels.map((p) => (
            <div key={p._id || p.id} className="relative aspect-square overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.media?.[0]?.url && <img src={p.media[0].url} alt="reel" className="h-full w-full object-cover" />}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'checkins' && (
        <div className="mt-4">
          <h3 className="mb-2 text-base font-semibold">Check-ins</h3>
          <div className="card p-4 text-sm text-black/70 dark:text-white/70">No check-ins yet. Tag locations in your posts to see them here.</div>
        </div>
      )}

      {activeTab === 'life' && (
        <div className="mt-4">
          <h3 className="mb-2 text-base font-semibold">Life Events</h3>
          <div className="card p-4 text-sm text-black/70 dark:text-white/70">Add milestones like graduation, new job, or moves. Coming soon.</div>
        </div>
      )}

      {activeTab === 'likes' && (
        <div className="mt-4">
          <h3 className="mb-2 text-base font-semibold">Likes & Interests</h3>
          <div className="card p-4 text-sm text-black/70 dark:text-white/70">Pages, music, and interests you follow will appear here. Coming soon.</div>
        </div>
      )}
    </div>
  );
}

function AboutEditor({ profile, onSaved }) {
  const [form, setForm] = useState({
    nickname: profile.nickname || '',
    gender: profile.gender || '',
    relationshipStatus: profile.relationshipStatus || '',
    currentCity: profile.currentCity || '',
    hometown: profile.hometown || '',
    phone: profile.phone || '',
    website: profile.website || '',
    birthday: profile.birthday ? new Date(profile.birthday).toISOString().slice(0,10) : '',
    pronouns: profile.pronouns || '',
    languages: (profile.languages || []).join(', '),
    favoriteQuotes: profile.favoriteQuotes || '',
    about: profile.about || '',
    workRole: '',
    workCompany: '',
    eduSchool: '',
    eduDegree: '',
  });
  const [saving, setSaving] = useState(false);

  function setField(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        nickname: form.nickname || undefined,
        gender: form.gender || undefined,
        relationshipStatus: form.relationshipStatus || undefined,
        currentCity: form.currentCity || undefined,
        hometown: form.hometown || undefined,
        phone: form.phone || undefined,
        website: form.website || undefined,
        birthday: form.birthday ? new Date(form.birthday) : undefined,
        pronouns: form.pronouns || undefined,
        languages: form.languages ? form.languages.split(',').map((s)=>s.trim()).filter(Boolean) : undefined,
        favoriteQuotes: form.favoriteQuotes || undefined,
        about: form.about || undefined,
        work: form.workRole || form.workCompany ? [{ role: form.workRole, company: form.workCompany }] : undefined,
        education: form.eduSchool || form.eduDegree ? [{ school: form.eduSchool, degree: form.eduDegree }] : undefined,
      };
      const { user } = await apiPatch('/api/users/me', payload);
      onSaved?.(user);
    } catch (e) {
      // no-op
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label className="block text-sm">Nickname</label>
        <input className="input" value={form.nickname} onChange={(e)=>setField('nickname', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm">Gender</label>
        <input className="input" value={form.gender} onChange={(e)=>setField('gender', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm">Relationship status</label>
        <input className="input" value={form.relationshipStatus} onChange={(e)=>setField('relationshipStatus', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm">Current city</label>
        <input className="input" value={form.currentCity} onChange={(e)=>setField('currentCity', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm">Hometown</label>
        <input className="input" value={form.hometown} onChange={(e)=>setField('hometown', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm">Phone</label>
        <input className="input" value={form.phone} onChange={(e)=>setField('phone', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm">Website</label>
        <input className="input" value={form.website} onChange={(e)=>setField('website', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm">Birthday</label>
        <input type="date" className="input" value={form.birthday} onChange={(e)=>setField('birthday', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm">Pronouns</label>
        <input className="input" value={form.pronouns} onChange={(e)=>setField('pronouns', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm">Languages (comma separated)</label>
        <input className="input" value={form.languages} onChange={(e)=>setField('languages', e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm">Favorite quotes</label>
        <input className="input" value={form.favoriteQuotes} onChange={(e)=>setField('favoriteQuotes', e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm">About you</label>
        <textarea className="input h-24" value={form.about} onChange={(e)=>setField('about', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm">Work Role</label>
        <input className="input" value={form.workRole} onChange={(e)=>setField('workRole', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm">Work Company</label>
        <input className="input" value={form.workCompany} onChange={(e)=>setField('workCompany', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm">Education School</label>
        <input className="input" value={form.eduSchool} onChange={(e)=>setField('eduSchool', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm">Education Degree</label>
        <input className="input" value={form.eduDegree} onChange={(e)=>setField('eduDegree', e.target.value)} />
      </div>
      <div className="md:col-span-2 flex justify-end">
        <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  );
}
function ProfileComposer({ onPosted }) {
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [tagged, setTagged] = useState('');
  const [location, setLocation] = useState('');
  const [feeling, setFeeling] = useState('');
  const [activity, setActivity] = useState('');
  const [posting, setPosting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setPosting(true);
    try {
      const payload = {
        caption: caption || undefined,
        media: imageUrl ? [{ url: imageUrl }] : undefined,
        privacy,
        taggedUsernames: tagged ? tagged.split(',').map(s=>s.trim()).filter(Boolean) : undefined,
        location: location ? { name: location } : undefined,
        feeling: feeling || undefined,
        activity: activity || undefined,
      };
      const res = await fetch(`${API_BASE}/api/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) {
        onPosted?.(data.post);
        setCaption(''); setImageUrl(''); setTagged(''); setLocation(''); setFeeling(''); setActivity(''); setPrivacy('public');
      }
    } catch {}
    setPosting(false);
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      <textarea className="input h-20" placeholder="What's on your mind?" value={caption} onChange={(e)=>setCaption(e.target.value)} />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <input className="input" placeholder="Image/Video URL (optional)" value={imageUrl} onChange={(e)=>setImageUrl(e.target.value)} />
        <select className="input" value={privacy} onChange={(e)=>setPrivacy(e.target.value)}>
          <option value="public">Public</option>
          <option value="friends">Friends</option>
          <option value="private">Only Me</option>
          <option value="custom">Custom</option>
        </select>
        <input className="input" placeholder="Tag people (usernames, comma)" value={tagged} onChange={(e)=>setTagged(e.target.value)} />
        <input className="input" placeholder="Location (check-in)" value={location} onChange={(e)=>setLocation(e.target.value)} />
        <input className="input" placeholder="Feeling" value={feeling} onChange={(e)=>setFeeling(e.target.value)} />
        <input className="input" placeholder="Activity" value={activity} onChange={(e)=>setActivity(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <button className="btn btn-primary" disabled={posting}>{posting ? 'Posting…' : 'Post'}</button>
      </div>
    </form>
  );
}

function PhotosSection({ username, userId, isMe }) {
  const [tab, setTab] = useState('albums'); // albums | tagged
  const [albums, setAlbums] = useState([]);
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [tagged, setTagged] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newAlbum, setNewAlbum] = useState({ name: '', description: '', privacy: 'public' });
  const [viewer, setViewer] = useState({ open: false, post: null });
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { albums: list } = await apiGet(`/api/albums/user/${username}`);
        setAlbums(list);
      } catch {}
      setLoading(false);
    })();
  }, [username]);

  async function openAlbum(a) {
    setActiveAlbum(a);
    try {
      const p = await apiGet(`/api/albums/${a.id}/photos${a.id === 'virtual:uploads' ? `?userId=${encodeURIComponent(userId)}` : ''}`);
      setPhotos(p.posts || []);
    } catch {}
  }

  async function openTagged() {
    setActiveAlbum(null);
    try {
      const p = await apiGet(`/api/posts/tagged/${username}`);
      setTagged(p.posts || []);
    } catch {}
  }

  async function createAlbum(e) {
    e?.preventDefault?.();
    try {
      const { album } = await apiPost('/api/albums', newAlbum);
      setShowCreate(false);
      setNewAlbum({ name: '', description: '', privacy: 'public' });
      // refresh
      const { albums: list } = await apiGet(`/api/albums/user/${username}`);
      setAlbums(list);
    } catch {}
  }

  async function loadComments(postId) {
    try {
      const { comments: list } = await apiGet(`/api/posts/${postId}/comments`);
      setComments(list || []);
    } catch {}
  }

  async function addComment(postId) {
    if (!commentText.trim()) return;
    try {
      const { comment } = await apiPost(`/api/posts/${postId}/comments`, { content: commentText.trim() });
      setComments((prev) => [comment, ...prev]);
      setCommentText('');
    } catch {}
  }

  return (
    <div className="mt-4">
      <div className="mb-4 flex items-center gap-4">
        <button className={`text-sm ${tab==='albums' ? 'font-semibold' : 'text-gray-500'}`} onClick={()=>{ setTab('albums'); setActiveAlbum(null); }}>
          Albums
        </button>
        <button className={`text-sm ${tab==='tagged' ? 'font-semibold' : 'text-gray-500'}`} onClick={()=>{ setTab('tagged'); openTagged(); }}>
          Tagged Photos
        </button>
        {isMe && tab==='albums' && (
          <button className="btn btn-outline ml-auto text-xs" onClick={()=>setShowCreate(true)}>Add New Album</button>
        )}
      </div>

      {tab === 'albums' && !activeAlbum && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {albums.length === 0 && !loading && (
            <div className="col-span-4 rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-black dark:text-white">No albums yet.</div>
          )}
          {albums.map((a) => (
            <button key={a.id} className="card text-left" onClick={()=>openAlbum(a)}>
              <div className="aspect-square overflow-hidden rounded bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {a.coverUrl ? <img src={a.coverUrl} alt="cover" className="h-full w-full object-cover" /> : <div className="h-full w-full" />}
              </div>
              <div className="p-2">
                <div className="truncate text-sm font-semibold">{a.name}</div>
                <div className="text-xs text-gray-500">{a.count} items</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === 'albums' && activeAlbum && (
        <div>
          <div className="mb-3 flex items-center gap-3">
            <button className="btn btn-outline px-2 py-1 text-xs" onClick={()=>{ setActiveAlbum(null); setPhotos([]); }}>Back</button>
            <div className="text-sm font-semibold">{activeAlbum.name}</div>
          </div>
          <div className="grid grid-cols-3 gap-1 md:gap-6">
            {photos.length === 0 && (
              <div className="col-span-3 rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-black dark:text-white">No photos yet.</div>
            )}
            {photos.map((p) => (
              <button key={p._id} onClick={()=>{ setViewer({ open: true, post: p }); loadComments(p._id); }} className="relative aspect-square overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.media?.[0]?.url && <img src={p.media[0].url} alt="" className="h-full w-full object-cover" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'tagged' && (
        <div className="grid grid-cols-3 gap-1 md:gap-6">
          {tagged.length === 0 && (
            <div className="col-span-3 rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-black dark:text-white">No tagged photos.</div>
          )}
          {tagged.map((p) => (
            <button key={p._id} onClick={()=>{ setViewer({ open: true, post: p }); loadComments(p._id); }} className="relative aspect-square overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.media?.[0]?.url && <img src={p.media[0].url} alt="" className="h-full w-full object-cover" />}
            </button>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={createAlbum} className="w-full max-w-md rounded-xl border border-white/10 bg-white p-4 text-black shadow-lg dark:bg-black dark:text-white">
            <h3 className="mb-3 text-lg font-semibold">Create Album</h3>
            <label className="block text-sm">Name</label>
            <input className="input mb-3" value={newAlbum.name} onChange={(e)=>setNewAlbum({ ...newAlbum, name: e.target.value })} required />
            <label className="block text-sm">Description</label>
            <textarea className="input mb-3 h-24" value={newAlbum.description} onChange={(e)=>setNewAlbum({ ...newAlbum, description: e.target.value })} />
            <label className="block text-sm">Privacy</label>
            <select className="input mb-4" value={newAlbum.privacy} onChange={(e)=>setNewAlbum({ ...newAlbum, privacy: e.target.value })}>
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="private">Only Me</option>
              <option value="custom">Custom</option>
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-outline" onClick={()=>setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create</button>
            </div>
          </form>
        </div>
      )}

      {viewer.open && viewer.post && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4" onClick={()=>setViewer({ open: false, post: null })}>
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded bg-white text-black shadow-lg dark:bg-zinc-900 dark:text-white" onClick={(e)=>e.stopPropagation()}>
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="md:col-span-2 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {viewer.post.media?.[0]?.url && <img src={viewer.post.media[0].url} alt="" className="h-full w-full object-contain" />}
              </div>
              <div className="flex max-h-[80vh] flex-col p-3">
                <div className="mb-2 text-sm font-semibold">{viewer.post.user?.username || 'Photo'}</div>
                {viewer.post.caption && <div className="mb-2 whitespace-pre-wrap text-sm">{viewer.post.caption}</div>}
                <div className="mb-2 text-xs text-gray-500">❤ {viewer.post.likes || 0} · 💬 {viewer.post.commentsCount || 0}</div>
                <div className="mb-2 flex-1 overflow-auto">
                  {comments.map((c)=> (
                    <div key={c._id} className="mb-2 text-sm"><span className="font-semibold">{c.user?.username}</span> {c.content}</div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className="input flex-1" placeholder="Write a comment..." value={commentText} onChange={(e)=>setCommentText(e.target.value)} />
                  <button className="btn btn-primary" onClick={()=>addComment(viewer.post._id)}>Post</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
