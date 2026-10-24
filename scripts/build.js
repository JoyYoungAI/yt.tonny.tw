#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'videos.json');
const DIST_DIR = path.join(__dirname, '..', 'dist');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return `${Math.max(1, diffInSeconds)} seconds ago`;
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function build() {
  ensureDir(DIST_DIR);

  let videos = [];
  if (fs.existsSync(DATA_FILE)) {
    try {
      videos = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
      console.error('Error reading videos.json:', e.message);
    }
  }

  // Generate HTML
  const itemsHtml = videos.map((v, index) => {
    const rank = index + 1;
    const points = v.points || 42;
    const age = timeAgo(v.addedAt);
    const escapedTitle = escapeHtml(v.title);
    const escapedAuthor = escapeHtml(v.author);
    const safeAuthorUrl = escapeHtml(v.authorUrl || `https://www.youtube.com`);
    const safeThumb = escapeHtml(v.thumbnailUrl || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`);

    return `
    <tr class="athing" id="${v.id}" data-title="${escapedTitle.toLowerCase()}" data-author="${escapedAuthor.toLowerCase()}">
      <td align="right" valign="top" class="title rank-col"><span class="rank">${rank}.</span></td>
      <td valign="top" class="votecol">
        <div class="votearrow" onclick="vote('${v.id}')" title="upvote">▲</div>
      </td>
      <td valign="top" class="thumb-col">
        <div class="thumb-wrapper" onclick="playModal('${v.id}', '${escapedTitle}')">
          <img src="${safeThumb}" alt="${escapedTitle}" loading="lazy" class="yt-thumb" />
          <div class="play-overlay">▶</div>
        </div>
      </td>
      <td class="title">
        <div class="title-line">
          <a href="${v.url}" target="_blank" rel="noopener noreferrer" class="storylink">${escapedTitle}</a>
          <span class="sitebit comhead"> (<span class="sitestr">youtube.com</span>)</span>
        </div>
        <div class="subtext">
          <span class="score" id="score_${v.id}">${points} points</span> by 
          <a href="${safeAuthorUrl}" target="_blank" rel="noopener noreferrer" class="author-link">${escapedAuthor}</a> 
          <span class="age">${age}</span> | 
          <a href="javascript:void(0)" onclick="playModal('${v.id}', '${escapedTitle}')" class="sublink">play inline</a> | 
          <a href="${v.url}" target="_blank" rel="noopener noreferrer" class="sublink">youtube ↗</a>
        </div>
      </td>
    </tr>
    <tr class="spacer"><td colspan="4" height="6"></td></tr>
    `;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>yt.tonny.tw | Hacker Videos</title>
  <meta name="description" content="A curated Hacker News style YouTube video directory at yt.tonny.tw">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>▶️</text></svg>">
  <link rel="alternate" type="application/rss+xml" title="yt.tonny.tw RSS Feed" href="/rss.xml">
  <style>
    :root {
      --hn-bg: #f6f6ef;
      --hn-orange: #ff6600;
      --hn-text: #222222;
      --hn-subtext: #828282;
      --hn-link: #000000;
      --hn-visited: #828282;
      --hn-box-bg: #f6f6ef;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--hn-bg);
      color: var(--hn-text);
      font-family: Verdana, Geneva, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      line-height: 1.4;
      padding: 8px 12px 32px 12px;
    }

    #hnmain {
      width: 100%;
      max-width: 980px;
      margin: 0 auto;
      background-color: var(--hn-box-bg);
      border-radius: 2px;
    }

    /* Header */
    .hn-header {
      background-color: var(--hn-orange);
      padding: 4px 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 6px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #ffffff;
      background: #000000;
      color: #ffffff;
      font-weight: bold;
      font-size: 11px;
      width: 20px;
      height: 20px;
      line-height: 20px;
      text-align: center;
      border-radius: 2px;
      text-decoration: none;
    }
    .site-title {
      font-weight: bold;
      color: #000000;
      font-size: 14px;
      text-decoration: none;
    }
    .header-nav {
      font-size: 12px;
      color: #222;
    }
    .header-nav a {
      color: #000000;
      text-decoration: none;
      padding: 0 4px;
    }
    .header-nav a:hover {
      text-decoration: underline;
    }
    .header-right {
      font-size: 12px;
      color: #222;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header-right a {
      color: #000000;
      text-decoration: none;
    }
    .header-right a:hover {
      text-decoration: underline;
    }

    /* Search Bar */
    .search-container {
      padding: 8px 10px;
      background-color: #fafaf5;
      border-bottom: 1px solid #e7e7d8;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .search-input {
      width: 260px;
      max-width: 100%;
      padding: 4px 8px;
      font-size: 12px;
      border: 1px solid #ccc;
      border-radius: 2px;
      background: #fff;
    }
    .stats-info {
      font-size: 11px;
      color: var(--hn-subtext);
    }

    /* Item List */
    .itemlist {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }
    .rank-col {
      width: 26px;
      padding-right: 4px;
      padding-top: 3px;
    }
    .rank {
      color: var(--hn-subtext);
      font-size: 12px;
    }
    .votecol {
      width: 16px;
      padding-right: 6px;
      padding-top: 2px;
      text-align: center;
    }
    .votearrow {
      color: #9a9a9a;
      cursor: pointer;
      font-size: 10px;
      user-select: none;
      transition: color 0.15s ease;
    }
    .votearrow:hover, .votearrow.voted {
      color: var(--hn-orange);
    }
    
    /* Thumbnail */
    .thumb-col {
      width: 124px;
      padding-right: 10px;
      padding-top: 2px;
    }
    .thumb-wrapper {
      position: relative;
      width: 120px;
      height: 68px;
      border-radius: 3px;
      overflow: hidden;
      cursor: pointer;
      background-color: #000;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }
    .yt-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.2s ease;
    }
    .thumb-wrapper:hover .yt-thumb {
      transform: scale(1.05);
      opacity: 0.88;
    }
    .play-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #fff;
      font-size: 16px;
      background: rgba(0,0,0,0.65);
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-left: 2px;
      transition: background 0.15s ease;
    }
    .thumb-wrapper:hover .play-overlay {
      background: var(--hn-orange);
    }

    /* Titles and Links */
    .title-line {
      line-height: 1.35;
      margin-bottom: 3px;
    }
    .storylink {
      color: var(--hn-link);
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
    }
    .storylink:visited {
      color: var(--hn-visited);
    }
    .storylink:hover {
      text-decoration: underline;
    }
    .sitebit {
      font-size: 11px;
      color: var(--hn-subtext);
    }
    .subtext {
      font-size: 11px;
      color: var(--hn-subtext);
      line-height: 1.5;
    }
    .subtext a {
      color: var(--hn-subtext);
      text-decoration: none;
    }
    .subtext a:hover {
      text-decoration: underline;
    }
    .author-link {
      font-weight: bold;
      color: #444 !important;
    }
    .spacer {
      border-bottom: 1px solid #ebebdc;
    }

    /* Footer */
    .hn-footer {
      margin-top: 36px;
      border-top: 2px solid var(--hn-orange);
      padding-top: 14px;
      text-align: center;
      font-size: 11px;
      color: var(--hn-subtext);
    }
    .footer-links {
      margin-bottom: 10px;
    }
    .footer-links a {
      color: var(--hn-text);
      text-decoration: none;
      padding: 0 4px;
    }
    .footer-links a:hover {
      text-decoration: underline;
    }

    /* Modal Player */
    .modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      z-index: 9999;
      justify-content: center;
      align-items: center;
      padding: 16px;
    }
    .modal-backdrop.active {
      display: flex;
    }
    .modal-content {
      background: #000;
      width: 100%;
      max-width: 860px;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0,0,0,0.5);
    }
    .modal-header {
      background: #1a1a1a;
      color: #fff;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }
    .modal-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-right: 12px;
    }
    .modal-close {
      cursor: pointer;
      color: #aaa;
      font-size: 20px;
      line-height: 1;
      padding: 0 4px;
    }
    .modal-close:hover { color: #fff; }
    .video-container {
      position: relative;
      padding-bottom: 56.25%;
      height: 0;
    }
    .video-container iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: 0;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .thumb-col {
        width: 84px;
      }
      .thumb-wrapper {
        width: 80px;
        height: 48px;
      }
      .storylink {
        font-size: 13px;
      }
      .search-input {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div id="hnmain">
    <header class="hn-header">
      <div class="header-left">
        <a href="/" class="logo-badge">▶</a>
        <a href="/" class="site-title">yt.tonny.tw</a>
        <nav class="header-nav">
          <a href="/">latest</a> | 
          <a href="#about">about</a> | 
          <a href="/rss.xml">rss</a>
        </nav>
      </div>
      <div class="header-right">
        <span>curated by Tonny</span>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
    </header>

    <div class="search-container">
      <input type="text" id="filterInput" class="search-input" placeholder="Filter videos by title or channel..." oninput="filterVideos()" />
      <span class="stats-info" id="statsCount">${videos.length} videos curated</span>
    </div>

    <table class="itemlist" id="videoTable">
      <tbody>
        ${itemsHtml || '<tr><td colspan="4" style="padding: 24px; text-align: center; color: #828282;">No videos yet. Run <code>npm run add &lt;URL&gt;</code> to add your first video!</td></tr>'}
      </tbody>
    </table>

    <footer class="hn-footer" id="about">
      <div class="footer-links">
        <a href="/">Home</a> | 
        <a href="/rss.xml">RSS Feed</a> | 
        <a href="https://github.com" target="_blank">Source Code</a> | 
        <a href="mailto:tonny@tonny.tw">Contact</a>
      </div>
      <p style="margin-top: 6px;">
        Designed in Hacker News style. Fast, lightweight, pure static HTML deployed on Cloudflare Pages.
      </p>
    </footer>
  </div>

  <!-- Video Player Modal -->
  <div class="modal-backdrop" id="videoModal" onclick="closeModal(event)">
    <div class="modal-content" onclick="event.stopPropagation()">
      <div class="modal-header">
        <span class="modal-title" id="modalVideoTitle">YouTube Video</span>
        <span class="modal-close" onclick="closeModal()">&times;</span>
      </div>
      <div class="video-container" id="playerContainer"></div>
    </div>
  </div>

  <script>
    function playModal(id, title) {
      const modal = document.getElementById('videoModal');
      const container = document.getElementById('playerContainer');
      const titleElem = document.getElementById('modalVideoTitle');
      titleElem.textContent = title;
      container.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      modal.classList.add('active');
    }

    function closeModal() {
      const modal = document.getElementById('videoModal');
      const container = document.getElementById('playerContainer');
      modal.classList.remove('active');
      container.innerHTML = '';
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal();
    });

    function vote(id) {
      const scoreElem = document.getElementById('score_' + id);
      if (!scoreElem) return;
      const key = 'voted_' + id;
      if (localStorage.getItem(key)) {
        return; // already voted
      }
      localStorage.setItem(key, 'true');
      const curr = parseInt(scoreElem.textContent) || 0;
      scoreElem.textContent = (curr + 1) + ' points';
      event.target.classList.add('voted');
    }

    function filterVideos() {
      const query = document.getElementById('filterInput').value.toLowerCase().trim();
      const rows = document.querySelectorAll('#videoTable tr.athing');
      let visible = 0;
      rows.forEach(row => {
        const title = row.getAttribute('data-title') || '';
        const author = row.getAttribute('data-author') || '';
        const match = !query || title.includes(query) || author.includes(query);
        row.style.display = match ? '' : 'none';
        const spacer = row.nextElementSibling;
        if (spacer && spacer.classList.contains('spacer')) {
          spacer.style.display = match ? '' : 'none';
        }
        if (match) visible++;
      });
      document.getElementById('statsCount').textContent = visible + ' videos shown';
    }
  </script>
</body>
</html>
`;

  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html, 'utf-8');

  // Generate RSS Feed
  const rssItems = videos.map(v => `
    <item>
      <title><![CDATA[${v.title}]]></title>
      <link>${v.url}</link>
      <guid>${v.url}</guid>
      <pubDate>${new Date(v.addedAt).toUTCString()}</pubDate>
      <description><![CDATA[<p><img src="${v.thumbnailUrl}" /><br/>By ${v.author}<br/><a href="${v.url}">Watch on YouTube</a></p>]]></description>
    </item>`).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>yt.tonny.tw | Hacker Videos</title>
    <link>https://yt.tonny.tw</link>
    <description>Curated Hacker News style YouTube videos</description>
    <language>zh-TW</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${rssItems}
  </channel>
</rss>`;

  fs.writeFileSync(path.join(DIST_DIR, 'rss.xml'), rss, 'utf-8');

  // Cloudflare headers
  const headers = `/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Cache-Control: public, max-age=3600
`;
  fs.writeFileSync(path.join(DIST_DIR, '_headers'), headers, 'utf-8');

  // CNAME
  fs.writeFileSync(path.join(DIST_DIR, 'CNAME'), 'yt.tonny.tw\n', 'utf-8');

  console.log(`Successfully built ${videos.length} videos to dist/`);
}

if (require.main === module) {
  build();
}

module.exports = build;
