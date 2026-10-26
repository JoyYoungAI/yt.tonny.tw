#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'videos.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Extract video ID from various YouTube URL formats
function extractVideoId(input) {
  if (!input) return null;
  const str = input.trim();

  // If directly 11 chars (standard YouTube ID)
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }

  // youtu.be/<id>
  const shortMatch = str.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/watch?v=<id>
  const watchMatch = str.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // youtube.com/shorts/<id>
  const shortsMatch = str.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  // youtube.com/embed/<id>
  const embedMatch = str.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  return null;
}

// Fetch YouTube oEmbed metadata
async function fetchMetadata(videoId) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;

  try {
    const res = await fetch(oembedUrl);
    if (!res.ok) {
      throw new Error(`oEmbed returned status ${res.status}`);
    }
    const data = await res.json();
    return {
      title: data.title || `YouTube Video (${videoId})`,
      author: data.author_name || 'YouTube Creator',
      authorUrl: data.author_url || `https://www.youtube.com`,
      thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  } catch (err) {
    console.warn(`Warning: Could not fetch oEmbed metadata (${err.message}). Using fallback defaults.`);
    return {
      title: `YouTube Video (${videoId})`,
      author: 'YouTube',
      authorUrl: 'https://www.youtube.com',
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isForce = args.includes('--force') || args.includes('-f') || args.includes('--update');
  const urlArg = args.find(arg => !arg.startsWith('-'));

  if (!urlArg) {
    console.error('Usage: node scripts/add-video.js <YouTube URL or ID> [--force]');
    process.exit(1);
  }

  const videoId = extractVideoId(urlArg);
  if (!videoId) {
    console.error(`Error: Could not extract a valid 11-character YouTube video ID from: "${urlArg}"`);
    process.exit(1);
  }

  console.log(`[1/3] Parsing video ID: ${videoId}`);

  let videos = [];
  if (fs.existsSync(DATA_FILE)) {
    try {
      videos = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
      console.warn('Could not parse existing videos.json, starting fresh.');
      videos = [];
    }
  }

  // Check if exists
  const existingIndex = videos.findIndex(v => v.id === videoId);
  if (existingIndex >= 0 && !isForce) {
    const existing = videos[existingIndex];
    console.log(`[ALREADY_EXISTS] 影片已在收藏清單中 (收錄時間: ${existing.addedAt})：`);
    console.log(`- 標題: ${existing.title}`);
    console.log(`- 頻道: ${existing.author}`);
    console.log(`- 縮圖: ${existing.thumbnailUrl}`);
    console.log(`- 網址: ${existing.url}`);
    console.log(`- 目前推文: ${existing.points} points`);
    console.log(`💡 提示：若欲強制更新中繼資料或縮圖，可加上 --force 參數。`);
    process.exit(2);
  }

  const metadata = await fetchMetadata(videoId);

  const videoEntry = {
    id: videoId,
    title: metadata.title,
    author: metadata.author,
    authorUrl: metadata.authorUrl,
    thumbnailUrl: metadata.thumbnailUrl,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    addedAt: existingIndex >= 0 ? videos[existingIndex].addedAt : new Date().toISOString(),
    points: existingIndex >= 0 ? videos[existingIndex].points : Math.floor(Math.random() * 45) + 15,
  };

  if (existingIndex >= 0) {
    console.log(`[2/3] Force updating metadata for existing video: "${videoEntry.title}"...`);
    videos[existingIndex] = { ...videos[existingIndex], ...videoEntry };
  } else {
    console.log(`[2/3] Adding new video: "${videoEntry.title}" by ${videoEntry.author}`);
    videos.unshift(videoEntry); // Add to the top
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(videos, null, 2) + '\n', 'utf-8');
  console.log(`Saved to ${DATA_FILE} (${videos.length} total videos)`);

  console.log(`[3/3] Rebuilding static site...`);
  const build = require('./build.js');
  build();
  console.log(`Done! Static site generated in dist/`);
}

main().catch(err => {
  console.error('Failed to add video:', err);
  process.exit(1);
});
