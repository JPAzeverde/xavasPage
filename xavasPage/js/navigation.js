/**
 * xavasPage — Sidebar & Navigation
 */

function renderSidebar(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <nav class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">&#x1F6E1;</span>
        <span class="brand-text">XAVASPAGE</span>
      </div>
      <ul class="sidebar-nav">
        <li><a href="home.html" class="nav-item active">&#x2316; HOME</a></li>
        <li><a href="games.html" class="nav-item">&#x1F3AE; GAMES</a></li>
        <li><a href="tvshows.html" class="nav-item">&#x1F4FA; TV SHOWS</a></li>
        <li><a href="tasks.html" class="nav-item">&#x1F4CB; TASKS</a></li>
        <li><a href="protocol.html" class="nav-item">&#x1F4C5; PROTOCOL</a></li>
        <li><a href="consumables.html" class="nav-item">&#x1F4E6; CONSUMABLES</a></li>
      </ul>
      <div class="sidebar-footer">
        <button id="logoutBtn" class="btn btn-ghost btn-sm w-full">&#x1F6AA; LOGOUT</button>
      </div>
    </nav>
  `;

  // Highlight current page
  const currentPage = window.location.pathname.split('/').pop();
  container.querySelectorAll('.nav-item').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    logoutSession();
    window.location.href = 'login.html';
  });
}