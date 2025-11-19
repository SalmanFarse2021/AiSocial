const VIDEO_EXTENSION_REGEX = /\.(mp4|webm|ogg|ogv|m4v|mov|avi|mkv)(?:$|\?)/i;
const VIDEO_FORMATS = new Set(['mp4', 'webm', 'ogg', 'ogv', 'm4v', 'mov', 'avi', 'mkv']);

export const VIDEO_FILE_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.ogv', '.m4v', '.mov', '.avi', '.mkv'];

export function looksLikeVideoUrl(url = '') {
  if (!url) return false;
  return VIDEO_EXTENSION_REGEX.test(url.toLowerCase());
}

export function looksLikeVideoFormat(format = '') {
  if (!format) return false;
  return VIDEO_FORMATS.has(format.toLowerCase());
}

export function isVideoMedia(media) {
  if (!media) return false;
  const normalizedType = typeof media.type === 'string' ? media.type.toLowerCase() : '';
  if (normalizedType === 'video') return true;
  if (looksLikeVideoFormat(media.format)) return true;
  return looksLikeVideoUrl(media.url);
}

function appendAutoplayParam(url, autoplay) {
  if (!autoplay) return url;
  return url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`;
}

export function getEmbedConfig(rawUrl, autoplay) {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    const pathSegments = parsed.pathname.split('/').filter(Boolean);

    const appendAutoplay = (base) => appendAutoplayParam(base, autoplay);
    const muteParam = autoplay ? 0 : 1;
    const vimeoMuteParam = autoplay ? 0 : 1;

    if (host.includes('youtube.com') || host === 'youtu.be' || host === 'youtube-nocookie.com' || host === 'm.youtube.com') {
      let videoId = parsed.searchParams.get('v');
      if (!videoId && host === 'youtu.be' && pathSegments[0]) {
        videoId = pathSegments[0];
      }
      if (!videoId && pathSegments.length) {
        if (pathSegments[0] === 'shorts' && pathSegments[1]) {
          videoId = pathSegments[1];
        } else if (pathSegments[0] === 'embed' && pathSegments[1]) {
          videoId = pathSegments[1];
        }
      }
      if (!videoId) return null;
      const base = `https://www.youtube-nocookie.com/embed/${videoId}?mute=${muteParam}&controls=0&playsinline=1&rel=0&loop=1&playlist=${videoId}`;
      return { src: appendAutoplay(base), provider: 'YouTube' };
    }

    if (host.includes('vimeo.com')) {
      const videoId = pathSegments.find((seg) => /^\d+$/.test(seg));
      if (!videoId) return null;
      const base = `https://player.vimeo.com/video/${videoId}?muted=${vimeoMuteParam}&loop=1&background=1`;
      return { src: appendAutoplay(base), provider: 'Vimeo' };
    }

    if (host.includes('dailymotion.com') || host === 'dai.ly') {
      let videoId = '';
      if (host === 'dai.ly' && pathSegments[0]) {
        videoId = pathSegments[0];
      } else if (pathSegments[0] === 'video' && pathSegments[1]) {
        videoId = pathSegments[1].split('_')[0];
      }
      if (!videoId) return null;
      const base = `https://www.dailymotion.com/embed/video/${videoId}?mute=${muteParam}&loop=1`;
      return { src: appendAutoplay(base), provider: 'Dailymotion' };
    }

    return null;
  } catch (err) {
    console.warn('getEmbedConfig failed', err);
    return null;
  }
}
