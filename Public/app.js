/* =========================================================
   VidTube — Single Page Application
   ========================================================= */

const API = '/api/v1';

// ===== API Service =====
const api = {
  async req(method, path, body, auth = false) {
    const opts = { method, headers: {}, credentials: 'include' };
    if (body instanceof FormData) {
      opts.body = body;
    } else if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(`${API}${path}`, opts);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { message: text }; }
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  },
  // Auth
  register: (d) => api.req('POST', '/auth/register', d),
  login: (d) => api.req('POST', '/auth/login', d),
  logout: (d) => api.req('POST', '/auth/logout', d),
  refresh: (d) => api.req('POST', '/auth/refresh', d),
  getMe: () => api.req('GET', '/users/me', null, true),
  // Videos
  listVideos: (page = 1) => api.req('GET', `/videos?page=${page}&limit=12`),
  getVideo: (id) => api.req('GET', `/videos/${id}`),
  deleteVideo: (id) => api.req('DELETE', `/videos/${id}`, null, true),
  uploadVideo: (fd) => {
    return fetch(`${API}/videos/upload`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    }).then(async r => {
      const d = await r.json();
      if (!r.ok) throw d;
      return d;
    });
  },
  // Comments
  postComment: (d) => api.req('POST', '/comments', d, true),
  getComments: (vid) => api.req('GET', `/comments/video/${vid}`),
  // Watch history
  addHistory: (vid) => api.req('POST', '/users/watch-history', { videoId: vid }, true),
  // Engagement
  toggleVideoLike: (vid) => api.req('POST', `/likes/toggle/v/${vid}`, {}, true),
  toggleSubscribe: (cid) => api.req('POST', `/subscriptions/c/${cid}`, {}, true),
};

// ===== State =====
const state = {
  user: null,
  isLoggedIn: false,
  sidebarOpen: window.innerWidth > 900,
  allVideos: [],
};

function getUser() { return state.user; }
function isLoggedIn() { return state.isLoggedIn; }

async function loadUser() {
  try {
    const data = await api.getMe();
    state.user = data.data.user;
    state.isLoggedIn = true;
  } catch {
    clearAuth();
  }
  renderNavEnd();
}

function setAuth(user) {
  state.user = user;
  state.isLoggedIn = true;
  renderNavEnd();
}

function clearAuth() {
  state.user = null;
  state.isLoggedIn = false;
  renderNavEnd();
}

// ===== Toast =====
function toast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const icons = { success: 'check_circle', error: 'error', info: 'info' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="material-symbols-outlined">${icons[type]}</span>${msg}`;
  c.appendChild(el);
  setTimeout(() => { el.classList.add('removing'); setTimeout(() => el.remove(), 300); }, 3500);
}

// ===== Helpers =====
function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  return `${m}:${s.toString().padStart(2,'0')}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
}

function avatarUrl(user) {
  return user?.avatar || '';
}

function avatarHtml(user, cls = '', size = 36) {
  const url = avatarUrl(user);
  if (url) return `<img src="${url}" class="${cls}" width="${size}" height="${size}" alt="avatar" onerror="this.outerHTML=defaultAvatarHtml('${(user?.fullName||'U')[0]}','${cls}',${size})">`;
  return defaultAvatarHtml((user?.fullName || 'U')[0], cls, size);
}

function defaultAvatarHtml(initial, cls, size) {
  return `<div class="default-avatar ${cls}" style="width:${size}px;height:${size}px;font-size:${Math.floor(size*0.4)}px">${initial.toUpperCase()}</div>`;
}

function defaultAvatarDataUrl(name) {
  const char = (name || 'U')[0].toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="16" fill="#667eea"/><text x="50%" y="55%" text-anchor="middle" dy=".35em" fill="white" font-family="Inter" font-weight="700" font-size="14">${char}</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// ===== Navbar =====
function renderNavEnd() {
  const el = document.getElementById('nav-end');
  if (!el) return;
  if (state.isLoggedIn && state.user) {
    const u = state.user;
    el.innerHTML = `
      <a href="#/upload" class="nav-upload-btn" title="Upload video">
        <span class="material-symbols-outlined">video_call</span>
      </a>
      <div class="nav-user-menu">
        <img src="${avatarUrl(u) || defaultAvatarDataUrl(u.fullName || u.username || 'U')}"
             class="nav-avatar" id="avatar-btn" alt="Profile"
             onerror="this.src=defaultAvatarDataUrl('${(u.fullName||u.username||'U').replace(/'/g, "\\'")}')">
        <div class="user-dropdown hidden" id="user-dropdown">
          <div class="dropdown-header">
            ${avatarHtml(u, '', 40)}
            <div>
              <div class="dropdown-name">${escapeHtml(u.fullName || u.username)}</div>
              <div class="dropdown-email">${escapeHtml(u.email || '')}</div>
            </div>
          </div>
          <a href="#/profile" class="dropdown-item" onclick="closeDropdown()">
            <span class="material-symbols-outlined">account_circle</span> Your Profile
          </a>
          <a href="#/history" class="dropdown-item" onclick="closeDropdown()">
            <span class="material-symbols-outlined">history</span> Watch History
          </a>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" id="logout-btn">
            <span class="material-symbols-outlined">logout</span> Sign Out
          </button>
        </div>
      </div>
    `;
    document.getElementById('avatar-btn')?.addEventListener('click', toggleDropdown);
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
  } else {
    el.innerHTML = `
      <button class="nav-signin" id="signin-btn">
        <span class="material-symbols-outlined">account_circle</span> Sign in
      </button>
    `;
    document.getElementById('signin-btn')?.addEventListener('click', () => showAuth());
  }
}

function toggleDropdown() {
  document.getElementById('user-dropdown')?.classList.toggle('hidden');
}
function closeDropdown() {
  document.getElementById('user-dropdown')?.classList.add('hidden');
}

async function handleLogout() {
  closeDropdown();
  try {
    await api.logout({});
  } catch {}
  clearAuth();
  toast('Signed out successfully', 'success');
  navigate('/');
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const menu = document.querySelector('.nav-user-menu');
  if (menu && !menu.contains(e.target)) closeDropdown();
});

// ===== Sidebar =====
function initSidebar() {
  const toggle = document.getElementById('sidebar-toggle');
  toggle?.addEventListener('click', () => {
    state.sidebarOpen = !state.sidebarOpen;
    document.getElementById('sidebar').classList.toggle('open', state.sidebarOpen);
    document.getElementById('main-content').classList.toggle('sidebar-open', state.sidebarOpen);
  });
}

function updateSidebarActive(route) {
  document.querySelectorAll('.sidebar-link').forEach(link => {
    const r = link.dataset.route;
    link.classList.toggle('active', r === route || (r === '/' && (route === '' || route === '/')));
  });
}

// ===== Auth Modal =====
function showAuth(tab = 'login') {
  const overlay = document.getElementById('auth-overlay');
  overlay.classList.remove('hidden');
  switchAuthTab(tab);
  hideAuthMsg();
}

function hideAuth() {
  document.getElementById('auth-overlay').classList.add('hidden');
  hideAuthMsg();
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
}

function showAuthMsg(msg, type = 'error') {
  const el = document.getElementById('auth-msg');
  el.textContent = msg;
  el.className = `auth-msg ${type}`;
}
function hideAuthMsg() {
  const el = document.getElementById('auth-msg');
  el.className = 'auth-msg hidden';
}

function initAuth() {
  document.getElementById('auth-close')?.addEventListener('click', hideAuth);
  document.getElementById('auth-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'auth-overlay') hideAuth();
  });
  document.querySelectorAll('.auth-tab').forEach(t => {
    t.addEventListener('click', () => switchAuthTab(t.dataset.tab));
  });

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-submit');
    btn.disabled = true; btn.textContent = 'Signing in…';
    try {
      const data = await api.login({
        email: document.getElementById('login-email').value.trim(),
        password: document.getElementById('login-password').value,
      });
      setAuth(data.data.user);
      await loadUser();
      hideAuth();
      toast('Welcome back!', 'success');
      handleRoute();
    } catch (err) {
      showAuthMsg(err.message || 'Login failed');
    }
    btn.disabled = false; btn.textContent = 'Sign In';
  });

  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('register-submit');
    btn.disabled = true; btn.textContent = 'Creating account…';
    try {
      await api.register({
        fullName: document.getElementById('reg-fullname').value.trim(),
        username: document.getElementById('reg-username').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        password: document.getElementById('reg-password').value,
      });
      showAuthMsg('Account created! Signing you in…', 'success');
      const loginData = await api.login({
        email: document.getElementById('reg-email').value.trim(),
        password: document.getElementById('reg-password').value,
      });
      setAuth(loginData.data.user);
      await loadUser();
      hideAuth();
      toast('Welcome to VidTube!', 'success');
      handleRoute();
    } catch (err) {
      showAuthMsg(err.message || 'Registration failed');
    }
    btn.disabled = false; btn.textContent = 'Create Account';
  });
}

// ===== Search =====
function initSearch() {
  document.getElementById('search-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('search-input').value.trim();
    if (q) navigate(`/search/${encodeURIComponent(q)}`);
    else navigate('/');
  });
}

// ===== Router =====
function navigate(path) { window.location.hash = '#' + path; }

function getRoute() {
  const h = window.location.hash.slice(1) || '/';
  return h;
}

function handleRoute() {
  const route = getRoute();
  const main = document.getElementById('main-content');
  if (!main) return;

  // Update sidebar
  if (route.startsWith('/watch/')) updateSidebarActive('');
  else if (route.startsWith('/search/')) updateSidebarActive('/');
  else updateSidebarActive(route);

  // Route
  if (route === '/' || route === '/home') {
    renderHome(main);
  } else if (route.startsWith('/watch/')) {
    renderWatch(main, route.split('/watch/')[1]);
  } else if (route === '/upload') {
    renderUpload(main);
  } else if (route === '/profile') {
    renderProfile(main);
  } else if (route === '/history') {
    renderHistory(main);
  } else if (route.startsWith('/search/')) {
    const q = decodeURIComponent(route.split('/search/')[1]);
    renderSearch(main, q);
  } else {
    main.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">explore_off</span><h2>Page not found</h2><p>The page you're looking for doesn't exist.</p><button class="btn-primary" onclick="navigate('/')">Go Home</button></div>`;
  }
}

// ===== Page: Home =====
async function renderHome(el) {
  el.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;
  try {
    const data = await api.listVideos();
    state.allVideos = data.data || [];
    if (state.allVideos.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <span class="material-symbols-outlined">video_library</span>
          <h2>No videos yet</h2>
          <p>Be the first to upload a video and share it with the world!</p>
          ${state.isLoggedIn ? '<button class="btn-primary" onclick="navigate(\'/upload\')">Upload Video</button>' : '<button class="btn-primary" onclick="showAuth()">Sign in to Upload</button>'}
        </div>`;
      return;
    }
    el.innerHTML = `
      <div class="page-header"><h1><span class="material-symbols-outlined">home</span> Home</h1></div>
      <div class="video-grid">${state.allVideos.map(videoCardHtml).join('')}</div>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">error</span><h2>Could not load videos</h2><p>${escapeHtml(err.message || 'Server error')}</p><button class="btn-primary" onclick="renderHome(document.getElementById('main-content'))">Retry</button></div>`;
  }
}

// ===== Page: Search =====
async function renderSearch(el, query) {
  el.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;
  try {
    const data = await api.listVideos();
    const all = data.data || [];
    const q = query.toLowerCase();
    const filtered = all.filter(v =>
      v.title?.toLowerCase().includes(q) ||
      v.description?.toLowerCase().includes(q) ||
      v.owner?.username?.toLowerCase().includes(q) ||
      v.owner?.fullName?.toLowerCase().includes(q)
    );
    el.innerHTML = `
      <div class="page-header"><h1><span class="material-symbols-outlined">search</span> Results for "${escapeHtml(query)}"</h1></div>
      ${filtered.length ? `<div class="video-grid">${filtered.map(videoCardHtml).join('')}</div>`
        : '<div class="empty-state"><span class="material-symbols-outlined">search_off</span><h2>No results found</h2><p>Try different keywords</p></div>'}`;
  } catch {
    el.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">error</span><h2>Search failed</h2></div>`;
  }
}

function videoCardHtml(v) {
  const owner = v.owner || {};
  const thumb = v.thumbnail && v.thumbnail !== v.videoUrl ? v.thumbnail : '';
  return `
    <div class="video-card" onclick="navigate('/watch/${v._id}')">
      <div class="thumb-wrap">
        ${thumb
          ? `<img src="${thumb}" alt="${escapeHtml(v.title)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ''}
        <div class="thumb-placeholder" ${thumb ? 'style="display:none"' : ''}>
          <span class="material-symbols-outlined">play_circle</span>
        </div>
        <span class="thumb-duration">${formatDuration(v.duration)}</span>
      </div>
      <div class="card-info">
        ${avatarHtml(owner, 'card-avatar', 36)}
        <div class="card-text">
          <div class="card-title">${escapeHtml(v.title)}</div>
          <div class="card-channel">${escapeHtml(owner.fullName || owner.username || 'Unknown')}</div>
          <div class="card-meta">${v.views || 0} views • ${timeAgo(v.createdAt)}</div>
        </div>
      </div>
    </div>`;
}

// ===== Page: Watch =====
async function renderWatch(el, videoId) {
  el.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;
  try {
    const vData = await api.getVideo(videoId);
    const video = vData.data;
    const owner = video.owner || {};

    // Add to watch history silently
    if (state.isLoggedIn) {
      api.addHistory(videoId).catch(() => {});
    }

    // Load comments
    let comments = [];
    try {
      const cData = await api.getComments(videoId);
      comments = cData.data || [];
    } catch {}

    el.innerHTML = `
      <div class="watch-layout">
        <div class="video-player-wrap">
          ${video.videoUrl
            ? `<video controls autoplay preload="metadata" poster="${video.thumbnail || ''}">
                 <source src="${video.videoUrl}?t=${Date.now()}" type="video/mp4">
                 Your browser does not support video.
               </video>`
            : '<div class="no-video-placeholder">Video unavailable</div>'}
        </div>

        <div class="watch-info">
          <h1 class="watch-title">${escapeHtml(video.title)}</h1>
          <div class="watch-meta" style="display:flex;justify-content:space-between;align-items:center;">
            <span>${video.views || 0} views • ${timeAgo(video.createdAt)}</span>
            <button class="btn-secondary toggle-like-btn ${video.isLiked ? 'btn-active' : ''}" onclick="toggleLike(this, '${video._id}')" style="display:flex;align-items:center;gap:6px;">
              <span class="material-symbols-outlined icon">thumb_up</span>
              <span class="count">${video.likesCount || 0}</span>
            </button>
          </div>
        </div>

        <div class="watch-channel" style="display:flex;align-items:center;">
          ${avatarHtml(owner, 'watch-channel-avatar', 48)}
          <div>
            <div class="watch-channel-name">${escapeHtml(owner.fullName || owner.username || 'Unknown')}</div>
          </div>
          ${owner._id !== (state.user && state.user._id) ? 
            `<button class="btn-primary toggle-sub-btn ${owner.isSubscribed ? 'btn-subscribed' : ''}" style="margin-left:auto; display:flex; align-items:center; gap:6px;" onclick="toggleSubscribe(this, '${owner._id}')">
                <span class="text">${owner.isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
                <span class="count" style="font-size:0.9em;opacity:0.8">${owner.subscribersCount || 0}</span>
             </button>` : 
            `<button class="btn-danger" style="margin-left:auto; display:flex; align-items:center; gap:6px;" onclick="handleDeleteVideo('${video._id}')">
                <span class="material-symbols-outlined" style="font-size:18px">delete</span> Delete
             </button>`}
        </div>

        ${video.description ? `<div class="watch-description">${escapeHtml(video.description)}</div>` : ''}

        <div class="comments-section">
          <div class="comments-header">Comments <span class="comment-count">${comments.length}</span></div>

          ${state.isLoggedIn
            ? `<div class="comment-input-wrap">
                 ${avatarHtml(state.user, 'comment-input-avatar', 40)}
                 <div class="comment-input-box">
                   <input type="text" id="comment-input" placeholder="Add a comment…">
                   <div class="comment-actions hidden" id="comment-actions">
                     <button class="btn-secondary" onclick="cancelComment()">Cancel</button>
                     <button class="btn-primary" id="comment-submit" onclick="submitComment('${videoId}')">Comment</button>
                   </div>
                 </div>
               </div>`
            : `<div class="login-to-comment">
                 <p>Sign in to leave a comment</p>
                 <button class="btn-primary" onclick="showAuth()">Sign In</button>
               </div>`}

          <div class="comment-list" id="comment-list">
            ${comments.map(commentHtml).join('') || '<p style="color:var(--text-muted);text-align:center;padding:16px">No comments yet. Be the first!</p>'}
          </div>
        </div>
      </div>`;

    // Comment input focus/blur
    const ci = document.getElementById('comment-input');
    ci?.addEventListener('focus', () => document.getElementById('comment-actions')?.classList.remove('hidden'));

  } catch (err) {
    el.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">error</span><h2>Video not found</h2><p>${escapeHtml(err.message || 'Could not load video')}</p><button class="btn-primary" onclick="navigate('/')">Go Home</button></div>`;
  }
}

function commentHtml(c) {
  const u = c.user || {};
  return `
    <div class="comment-item">
      ${avatarHtml(u, 'comment-avatar', 40)}
      <div class="comment-body">
        <div class="comment-author">${escapeHtml(u.fullName || u.username || 'User')} <span>${timeAgo(c.createdAt)}</span></div>
        <div class="comment-text">${escapeHtml(c.text)}</div>
      </div>
    </div>`;
}

function cancelComment() {
  const input = document.getElementById('comment-input');
  if (input) input.value = '';
  document.getElementById('comment-actions')?.classList.add('hidden');
}

async function submitComment(videoId) {
  const input = document.getElementById('comment-input');
  const text = input?.value.trim();
  if (!text) return;

  const btn = document.getElementById('comment-submit');
  btn.disabled = true; btn.textContent = 'Posting…';

  try {
    const data = await api.postComment({ videoId, text });
    const comment = data.data;
    // Add user info to the comment for rendering
    comment.user = state.user;
    const list = document.getElementById('comment-list');
    // Remove "no comments" placeholder if present
    const placeholder = list.querySelector('p');
    if (placeholder) placeholder.remove();
    list.insertAdjacentHTML('afterbegin', commentHtml(comment));
    input.value = '';
    document.getElementById('comment-actions')?.classList.add('hidden');
    // Update count
    const countEl = document.querySelector('.comment-count');
    if (countEl) countEl.textContent = parseInt(countEl.textContent || '0') + 1;
    toast('Comment posted!', 'success');
  } catch (err) {
    toast(err.message || 'Failed to post comment', 'error');
  }
  btn.disabled = false; btn.textContent = 'Comment';
}

// ===== Page: Upload =====
function renderUpload(el) {
  if (!state.isLoggedIn) {
    el.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">lock</span><h2>Sign in required</h2><p>You need to sign in to upload videos</p><button class="btn-primary" onclick="showAuth()">Sign In</button></div>`;
    return;
  }
  el.innerHTML = `
    <div class="upload-page">
      <div class="page-header"><h1><span class="material-symbols-outlined">video_call</span> Upload Video</h1></div>

      <div class="upload-dropzone" id="dropzone" onclick="document.getElementById('video-file').click()">
        <input type="file" id="video-file" accept="video/mp4,video/quicktime,video/webm" hidden>
        <span class="material-symbols-outlined">cloud_upload</span>
        <h3>Drag and drop or click to select</h3>
        <p>MP4, MOV, WebM — Max 50 MB</p>
        <div class="file-name hidden" id="file-name-display">
          <span class="material-symbols-outlined">check_circle</span>
          <span id="file-name-text"></span>
        </div>
      </div>

      <div class="upload-progress hidden" id="upload-progress"><div class="upload-progress-bar" id="upload-bar"></div></div>

      <form class="upload-form" id="upload-form">
        <div class="form-group">
          <label for="vid-title">Title *</label>
          <input type="text" id="vid-title" class="form-input" placeholder="Give your video a title" required>
        </div>
        <div class="form-group">
          <label for="vid-desc">Description *</label>
          <textarea id="vid-desc" class="form-input" placeholder="Tell viewers about your video" required></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="vid-duration">Duration (seconds) *</label>
            <input type="number" id="vid-duration" class="form-input" placeholder="e.g. 120" required min="1">
          </div>
          <div class="form-group">
            <label for="vid-visibility">Visibility</label>
            <select id="vid-visibility" class="form-input">
              <option value="true">Public</option>
              <option value="false">Private</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="vid-thumb">Thumbnail URL (optional)</label>
          <input type="url" id="vid-thumb" class="form-input" placeholder="https://...">
        </div>
        <button type="submit" class="btn-primary btn-full" id="upload-btn">
          <span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;margin-right:6px">upload</span> Upload Video
        </button>
      </form>
    </div>`;

  // File input
  const fileInput = document.getElementById('video-file');
  const dropzone = document.getElementById('dropzone');

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) showFileName(fileInput.files[0].name);
  });

  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault(); dropzone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) {
      fileInput.files = e.dataTransfer.files;
      showFileName(e.dataTransfer.files[0].name);
    }
  });

  // Form submit
  document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!fileInput.files[0]) { toast('Please select a video file', 'error'); return; }

    const btn = document.getElementById('upload-btn');
    btn.disabled = true; btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;margin-right:6px;animation:spin 1s linear infinite">progress_activity</span> Uploading…';
    document.getElementById('upload-progress').classList.remove('hidden');
    document.getElementById('upload-bar').style.width = '30%';

    const fd = new FormData();
    fd.append('videoFile', fileInput.files[0]);
    fd.append('title', document.getElementById('vid-title').value.trim());
    fd.append('description', document.getElementById('vid-desc').value.trim());
    fd.append('duration', document.getElementById('vid-duration').value);
    fd.append('isPublic', document.getElementById('vid-visibility').value);
    const thumb = document.getElementById('vid-thumb').value.trim();
    if (thumb) fd.append('thumbnail', thumb);

    try {
      document.getElementById('upload-bar').style.width = '60%';
      const data = await api.uploadVideo(fd);
      document.getElementById('upload-bar').style.width = '100%';
      toast('Video uploaded successfully!', 'success');
      setTimeout(() => navigate(`/watch/${data.data._id}`), 500);
    } catch (err) {
      toast(err.message || 'Upload failed', 'error');
      document.getElementById('upload-progress').classList.add('hidden');
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;margin-right:6px">upload</span> Upload Video';
    }
  });
}

function showFileName(name) {
  document.getElementById('file-name-display').classList.remove('hidden');
  document.getElementById('file-name-text').textContent = name;
}

// ===== Page: Profile =====
async function renderProfile(el) {
  if (!state.isLoggedIn) {
    el.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">lock</span><h2>Sign in required</h2><p>Sign in to view your profile</p><button class="btn-primary" onclick="showAuth()">Sign In</button></div>`;
    return;
  }
  el.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;
  try {
    const data = await api.getMe();
    const user = data.data.user;
    state.user = user;

    el.innerHTML = `
      <div class="profile-page">
        <div class="page-header"><h1><span class="material-symbols-outlined">account_circle</span> Your Profile</h1></div>
        <div class="profile-card">
          ${avatarHtml(user, 'profile-avatar-large', 96)}
          <div class="profile-details">
            <h2>${escapeHtml(user.fullName)}</h2>
            <div class="profile-username">@${escapeHtml(user.username)}</div>
            <div class="profile-email">${escapeHtml(user.email)}</div>
            <div class="profile-joined">Joined ${new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
      </div>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">error</span><h2>Could not load profile</h2><p>${escapeHtml(err.message || '')}</p></div>`;
  }
}

// ===== Page: Watch History =====
async function renderHistory(el) {
  if (!state.isLoggedIn) {
    el.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">lock</span><h2>Sign in required</h2><p>Sign in to view your watch history</p><button class="btn-primary" onclick="showAuth()">Sign In</button></div>`;
    return;
  }
  el.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;
  try {
    const data = await api.getMe();
    const watchHistory = data.data.watchHistory || [];
    state.user = data.data.user;

    if (watchHistory.length === 0) {
      el.innerHTML = `
        <div class="page-header"><h1><span class="material-symbols-outlined">history</span> Watch History</h1></div>
        <div class="empty-state"><span class="material-symbols-outlined">history_toggle_off</span><h2>No watch history</h2><p>Videos you watch will appear here</p><button class="btn-primary" onclick="navigate('/')">Browse Videos</button></div>`;
      return;
    }

    el.innerHTML = `
      <div class="page-header"><h1><span class="material-symbols-outlined">history</span> Watch History</h1></div>
      <div class="video-grid">${watchHistory.map(v => {
        // Watch history might be populated or just IDs
        if (typeof v === 'string' || !v.title) {
          return `<div class="video-card" onclick="navigate('/watch/${v._id || v}')">
            <div class="thumb-wrap"><div class="thumb-placeholder"><span class="material-symbols-outlined">play_circle</span></div></div>
            <div class="card-info"><div class="card-text"><div class="card-title">Video</div><div class="card-meta">Click to watch</div></div></div>
          </div>`;
        }
        return videoCardHtml(v);
      }).join('')}</div>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">error</span><h2>Could not load history</h2></div>`;
  }
}

// ===== Health Check =====
async function checkHealth() {
  const dot = document.getElementById('health-dot');
  const label = document.getElementById('health-label');
  try {
    const res = await fetch('/health');
    const data = await res.json();
    if (data.status === 'ok') {
      dot.className = 'health-dot ok';
      label.textContent = 'API Online';
    } else {
      dot.className = 'health-dot err';
      label.textContent = 'DB Degraded';
    }
  } catch {
    dot.className = 'health-dot err';
    label.textContent = 'API Offline';
  }
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', async () => {
  initSidebar();
  initAuth();
  initSearch();

  // Check for OAuth redirect tokens
  checkOAuthReturn();

  // Check if already logged in (unconditionally try to load user on boot)
  await loadUser();
  renderNavEnd();

  // Initial route
  handleRoute();
  window.addEventListener('hashchange', handleRoute);

  // Health check
  checkHealth();
  setInterval(checkHealth, 60000);

  // Responsive sidebar
  if (window.innerWidth <= 900) {
    state.sidebarOpen = false;
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('main-content').classList.remove('sidebar-open');
  }
});

// Check if returning from OAuth
function checkOAuthReturn() {
  const params = new URLSearchParams(window.location.search);
  const success = params.get('oauth');
  const error = params.get('error');
  
  if (success === 'success') {
    toast('Google sign-in successful!', 'success');
    window.history.replaceState({}, document.title, '/');
  } else if (error) {
    toast(decodeURIComponent(error), 'error');
    window.history.replaceState({}, document.title, '/');
  }
}

// Make functions globally accessible for onclick handlers
window.navigate = navigate;
window.showAuth = showAuth;
window.cancelComment = cancelComment;
window.submitComment = submitComment;
window.closeDropdown = closeDropdown;
window.renderHome = renderHome;
window.defaultAvatarHtml = defaultAvatarHtml;
window.handleRoute = handleRoute;

window.handleDeleteVideo = async (vid) => {
  if (!confirm("Are you sure you want to delete this video? This cannot be undone.")) return;
  try {
    await api.deleteVideo(vid);
    toast('Video deleted successfully', 'success');
    navigate('/');
  } catch (err) {
    toast(err.message || 'Failed to delete video', 'error');
  }
};

window.toggleLike = async (btn, vid) => {
  if (!state.isLoggedIn) return showAuth();
  
  const isActive = btn.classList.contains('btn-active');
  const countEl = btn.querySelector('.count');
  let currentCount = parseInt(countEl.textContent || '0');
  
  // Optimistic UI toggle
  if (isActive) {
    btn.classList.remove('btn-active');
    countEl.textContent = Math.max(0, currentCount - 1);
  } else {
    btn.classList.add('btn-active');
    countEl.textContent = currentCount + 1;
  }
  
  btn.classList.add('pop-anim');
  setTimeout(() => btn.classList.remove('pop-anim'), 300);

  try {
    await api.toggleVideoLike(vid);
  } catch (err) {
    // Revert on error
    if (isActive) {
      btn.classList.add('btn-active');
      countEl.textContent = currentCount;
    } else {
      btn.classList.remove('btn-active');
      countEl.textContent = currentCount;
    }
    toast(err.message || 'Failed to toggle like', 'error');
  }
};

window.toggleSubscribe = async (btn, cid) => {
  if (!state.isLoggedIn) return showAuth();
  
  const isSubbed = btn.classList.contains('btn-subscribed');
  const textEl = btn.querySelector('.text');
  const countEl = btn.querySelector('.count');
  let currentCount = parseInt(countEl.textContent || '0');
  
  // Optimistic UI toggle
  if (isSubbed) {
    btn.classList.remove('btn-subscribed');
    textEl.textContent = 'Subscribe';
    countEl.textContent = Math.max(0, currentCount - 1);
  } else {
    btn.classList.add('btn-subscribed');
    textEl.textContent = 'Subscribed';
    countEl.textContent = currentCount + 1;
  }
  
  btn.classList.add('pop-anim');
  setTimeout(() => btn.classList.remove('pop-anim'), 300);

  try {
    await api.toggleSubscribe(cid);
  } catch (err) {
    // Revert
    if (isSubbed) {
      btn.classList.add('btn-subscribed');
      textEl.textContent = 'Subscribed';
      countEl.textContent = currentCount;
    } else {
      btn.classList.remove('btn-subscribed');
      textEl.textContent = 'Subscribe';
      countEl.textContent = currentCount;
    }
    toast(err.message || 'Failed to subscribe', 'error');
  }
};
