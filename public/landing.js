/* ============================================================
   CLUSTR CORE — PREMIUM LANDING JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── THEME MANAGEMENT ──────────────────────────────────── */
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;

  const savedTheme = localStorage.getItem('clustr-theme') || 'light';
  applyTheme(savedTheme);

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('clustr-theme', theme);
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }

  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    themeToggle.style.transform = 'scale(0.85) rotate(20deg)';
    setTimeout(() => { themeToggle.style.transform = ''; applyTheme(next); }, 150);
  });

  /* ── HEADER SCROLL EFFECT ──────────────────────────────── */
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  /* ── HAMBURGER / SIDE MENU ─────────────────────────────── */
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const sideMenu     = document.getElementById('sideMenu');
  const overlay      = document.getElementById('overlay');

  function openMenu() {
    sideMenu.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    sideMenu.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburgerBtn.addEventListener('click', openMenu);
  closeMenuBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ── EVENTS CAROUSEL ────────────────────────────────────── */
  const carousel = document.getElementById('eventsCarousel');
  const prevBtn  = document.getElementById('prevBtn');
  const nextBtn  = document.getElementById('nextBtn');

  function updateCarouselBtns() {
    if (!carousel) return;
    prevBtn.style.opacity = carousel.scrollLeft <= 0 ? '0.4' : '1';
    nextBtn.style.opacity = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 5 ? '0.4' : '1';
  }

  if (carousel && prevBtn && nextBtn) {
    const scrollAmount = 316;
    nextBtn.addEventListener('click', () => carousel.scrollBy({ left:  scrollAmount, behavior: 'smooth' }));
    prevBtn.addEventListener('click', () => carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' }));
    carousel.addEventListener('scroll', updateCarouselBtns, { passive: true });
    updateCarouselBtns();

    let isDragging = false, startX, startScroll;
    carousel.addEventListener('mousedown', (e) => {
      isDragging = true;
      carousel.style.cursor = 'grabbing';
      startX = e.pageX - carousel.offsetLeft;
      startScroll = carousel.scrollLeft;
    });
    document.addEventListener('mouseup', () => { isDragging = false; carousel.style.cursor = ''; });
    carousel.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      carousel.scrollLeft = startScroll - (e.pageX - carousel.offsetLeft - startX) * 1.5;
    });
  }

  /* ── SCROLL REVEAL ──────────────────────────────────────── */
  function attachReveal(elements) {
    elements.forEach(el => el.classList.add('reveal'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const siblings = [...entry.target.parentElement.children];
        setTimeout(() => entry.target.classList.add('visible'), siblings.indexOf(entry.target) * 80);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    elements.forEach(el => observer.observe(el));
  }

  attachReveal([...document.querySelectorAll('.section-title, .section-header')]);

  /* ── REGISTER BUTTON RIPPLE ─────────────────────────────── */
  function attachRipple(btn) {
    btn.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      const rect   = this.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height);
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${e.clientX - rect.left - size / 2}px;
        top: ${e.clientY - rect.top - size / 2}px;
        background: rgba(255,255,255,0.35);
        border-radius: 50%;
        transform: scale(0);
        animation: rippleAnim 0.5s ease-out forwards;
        pointer-events: none;
      `;
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
      const eventId   = this.dataset.id || '';
      const eventName = this.closest('.event-card')?.querySelector('h3')?.textContent?.trim() || '';
      setTimeout(() => {
          window.location.href = `/register.html?id=${eventId}&event=${encodeURIComponent(eventName)}`;
      }, 300);
    });
  }

  const style = document.createElement('style');
  style.textContent = `@keyframes rippleAnim { to { transform: scale(2.5); opacity: 0; } }`;
  document.head.appendChild(style);

  /* ── ANNOUNCEMENT CARD TILT ─────────────────────────────── */
  function attachTilt(card) {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `translateY(-3px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  }

  /* ── SMOOTH ANCHOR SCROLL ───────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); closeMenu(); }
    });
  });

  /* ── NEWSLETTER FORM ────────────────────────────────────── */
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input');
      const btn   = newsletterForm.querySelector('button');
      btn.innerHTML = '<i class="fas fa-check"></i>';
      btn.style.background = '#3a9c5a';
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        btn.style.background = '';
        input.value = '';
      }, 2000);
    });
  }

  /* ── CURSOR GLOW (desktop only) ─────────────────────────── */
  if (window.innerWidth > 1024) {
    const glow = document.createElement('div');
    glow.style.cssText = `
      position: fixed;
      width: 300px; height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(200,98,58,0.06) 0%, transparent 70%);
      pointer-events: none;
      z-index: 9999;
      transition: transform 0.15s ease;
      transform: translate(-50%, -50%);
    `;
    document.body.appendChild(glow);
    document.addEventListener('mousemove', (e) => {
      glow.style.left = e.clientX + 'px';
      glow.style.top  = e.clientY + 'px';
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════════════
     BACKEND DATA LOADING
  ══════════════════════════════════════════════════════════ */
  const BASE_URL = '';  // same origin — no need for localhost:5000

  async function loadSection(url, containerId, emptyStateId, renderFn, postLoad) {
    try {
      const res      = await fetch(url);
      const data     = await res.json();
      const container  = document.getElementById(containerId);
      const emptyState = document.getElementById(emptyStateId);
      if (!data || !data.length) return;
      emptyState.remove();
      container.insertAdjacentHTML('beforeend', data.map(renderFn).join(''));
      if (postLoad) postLoad(container);
    } catch (e) {
      console.error(`ClustrCore: failed to load ${url}`, e);
    }
  }

  // ── Events ──────────────────────────────────────────────
  loadSection(
    `${BASE_URL}/api/events/public`,
    'eventsCarousel',
    'eventsEmptyState',
    e => `
      <div class="event-card">
        <div class="event-image">
          <img src="${e.image}" alt="${e.title}" loading="lazy">
          <div class="event-badge">${e.status}</div>
        </div>
        <div class="event-content">
          <h3>${e.title}</h3>
          <p class="event-date"><i class="fas fa-calendar"></i> ${e.date}</p>
          <p class="event-time"><i class="fas fa-clock"></i> ${e.time}</p>
          <p class="event-desc">${e.description}</p>
          <button class="btn-event" data-status="${e.status.toLowerCase()}" data-id="${e._id}">
            ${e.status === 'Open' ? 'Register Now' : 'Coming Soon'}
          </button>
        </div>
      </div>`,
    (container) => {
      container.querySelectorAll('.btn-event[data-status="open"]').forEach(attachRipple);
      attachReveal([...container.querySelectorAll('.event-card')]);
      updateCarouselBtns();
    }
  );

  // ── Gallery ─────────────────────────────────────────────
  loadSection(
    `${BASE_URL}/api/events/public/gallery`,
    'galleryScroll',
    'galleryEmptyState',
    p => `
      <div class="gallery-item">
        <img src="${p.url}" alt="${p.caption}" loading="lazy">
        <div class="gallery-overlay"><p>${p.caption}</p></div>
      </div>`,
    (container) => attachReveal([...container.querySelectorAll('.gallery-item')])
  );

  // ── Announcements ────────────────────────────────────────
  loadSection(
    `${BASE_URL}/api/events/public/announcements`,
    'announcementsGrid',
    'announcementsEmptyState',
    a => `
      <div class="announcement-card">
        <div class="announcement-icon"><i class="fas ${a.icon || 'fa-bullhorn'}"></i></div>
        <div class="announcement-content">
          <h3>${a.title}</h3>
          <p>${a.body}</p>
          <div class="announcement-meta">
            <span class="date"><i class="fas fa-calendar"></i> ${a.date}</span>
            <span class="author"><i class="fas fa-user"></i> ${a.author}</span>
          </div>
        </div>
      </div>`,
    (container) => {
      container.querySelectorAll('.announcement-card').forEach(attachTilt);
      attachReveal([...container.querySelectorAll('.announcement-card')]);
    }
  );

  // ── Team Members & Faculty ───────────────────────────
  (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/events/public/team`);
      const data = await res.json();
      const container = document.getElementById('teamGrid');
      const emptyState = document.getElementById('teamEmptyState');
      if (!data || (!data.team?.length && !data.faculty?.length && !data.admin?.length)) return;
      emptyState.remove();

      // Render Team
      if (data.team?.length) {
        container.insertAdjacentHTML('beforeend', '<h3 style="grid-column:1/-1; text-align:center; margin:2rem 0 1rem; color:#c8623a;">Core Team</h3>');
        container.insertAdjacentHTML('beforeend', data.team.map(m => {
        const imageSrc = m.photo ? `data:${m.photoMime};base64,${m.photo}` : '/assets/default-avatar.png';
        const linkedinHTML = m.linkedin ? `<p class="social"><a href="${m.linkedin}" target="_blank" rel="noopener noreferrer"><i class="fab fa-linkedin"></i></a></p>` : '';
        return `
          <div class="team-card">
            <div class="team-image">
              <img src="${imageSrc}" alt="${m.name}" loading="lazy">
            </div>
            <div class="team-info">
              <h3>${m.name}</h3>
              <p class="role">${m.teamRole || 'Team Member'} - ${m.team || 'General'}</p>
              ${linkedinHTML}
              ${m.phone ? `<p class="contact"><i class="fas fa-phone"></i> ${m.phone}</p>` : ''}
            </div>
          </div>`;
      }).join(''));
      }

      // Render Admin
      if (data.admin?.length) {
        container.insertAdjacentHTML('beforeend', '<h3 style="grid-column:1/-1; text-align:center; margin:2rem 0 1rem; color:#c8623a;">Admin Team</h3>');
        container.insertAdjacentHTML('beforeend', data.admin.map(a => {
        const imageSrc = a.photo ? `data:${a.photoMime};base64,${a.photo}` : '/assets/default-avatar.png';
        const linkedinHTML = a.linkedin ? `<p class="social"><a href="${a.linkedin}" target="_blank" rel="noopener noreferrer"><i class="fab fa-linkedin"></i></a></p>` : '';
        return `
          <div class="team-card">
            <div class="team-image">
              <img src="${imageSrc}" alt="${a.name}" loading="lazy">
            </div>
            <div class="team-info">
              <h3>${a.name}</h3>
              <p class="role">${a.teamRole || 'Administrator'}</p>
              ${linkedinHTML}
              ${a.phone ? `<p class="contact"><i class="fas fa-phone"></i> ${a.phone}</p>` : ''}
            </div>
          </div>`;
      }).join(''));
      }

      // Render Faculty
      if (data.faculty?.length) {
        container.insertAdjacentHTML('beforeend', '<h3 style="grid-column:1/-1; text-align:center; margin:2rem 0 1rem; color:#c8623a;">Faculty Advisors</h3>');
        container.insertAdjacentHTML('beforeend', data.faculty.map(f => {
        const imageSrc = f.photo ? `data:${f.photoMime};base64,${f.photo}` : '/assets/default-avatar.png';
        const linkedinHTML = f.linkedin ? `<p class="social"><a href="${f.linkedin}" target="_blank" rel="noopener noreferrer"><i class="fab fa-linkedin"></i></a></p>` : '';
        return `
          <div class="team-card">
            <div class="team-image">
              <img src="${imageSrc}" alt="${f.name}" loading="lazy">
            </div>
            <div class="team-info">
              <h3>${f.name}</h3>
              <p class="role">${f.designation}</p>
              <p class="department">${f.department}</p>
              ${f.qualification ? `<p class="qual">${f.qualification}</p>` : ''}
              ${linkedinHTML}
            </div>
          </div>`;
      }).join(''));
      }

      attachReveal([...container.querySelectorAll('.team-card')]);
    } catch (e) {
      console.error('ClustrCore: failed to load team/faculty', e);
    }
  })();

  // ── Companies Collaborated ─────────────────────────────
  (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/events/public`);
      const events = await res.json();
      const companiesMap = new Map();
      events.forEach(e => {
        (e.companies || []).forEach(c => {
          if (!companiesMap.has(c.name)) {
            companiesMap.set(c.name, c);
          }
        });
      });
      const companies = Array.from(companiesMap.values());
      const container = document.getElementById('companiesGrid');
      const emptyState = document.getElementById('companiesEmptyState');
      if (!companies.length) return;
      emptyState.remove();
      container.insertAdjacentHTML('beforeend', companies.map(c => `
        <div class="company-card">
          <div class="company-logo">
            <img src="${c.logo || '/assets/default-logo.png'}" alt="${c.name}" loading="lazy">
          </div>
          <div class="company-info">
            <h3>${c.name}</h3>
            <p class="role">${c.role}</p>
            ${c.website ? `<a href="${c.website}" target="_blank" class="website-link"><i class="fas fa-external-link-alt"></i> Visit</a>` : ''}
          </div>
        </div>`).join(''));
      attachReveal([...container.querySelectorAll('.company-card')]);
    } catch (e) {
      console.error('ClustrCore: failed to load companies', e);
    }
  })();

  console.log('%cClustrCore ✦', 'font-family: sans-serif; font-size: 18px; font-weight: bold; color: #c8623a;');
  console.log('%cPowered by passion & curiosity.', 'color: #9c958d; font-size: 12px;');

});