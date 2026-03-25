/* ============================================================
   CLUSTR CORE — SIGNUP JS (Updated with Photo & Social Links)
============================================================ */

const TEAM_ROLES = {
  tech:    ['Lead Developer', 'Backend Developer', 'Frontend Developer', 'DevOps Engineer'],
  events:  ['Event Lead', 'Coordinator', 'Logistics Head', 'Outreach Lead'],
  digital: ['Design Lead', 'Social Media Manager', 'Content Creator'],
};

let selectedRole     = '';
let selectedTeam     = '';
let selectedTeamRole = '';
let photoFile        = null;

/* ── Show banner ────────────────────────────────────────── */
function showBanner(msg, type = 'error') {
  const banner = document.getElementById('msgBanner');
  if (!banner) return;
  document.getElementById('msgText').textContent = msg;
  banner.className = `msg-banner ${type} show`;
  setTimeout(() => banner?.classList.remove('show'), 4500);
}

/* ── Loading spinner ────────────────────────────────────── */
function setLoading(on) {
  const submitBtn = document.getElementById('submitBtn');
  const spinner   = document.getElementById('spinner');
  const btnText   = document.getElementById('btnText');
  if (submitBtn) submitBtn.disabled = on;
  if (spinner) spinner.style.display = on ? 'block' : 'none';
  if (btnText) btnText.style.display = on ? 'none' : 'flex';
}

/* ── ROLE CARDS ─────────────────────────────────────────── */
document.getElementById('roleGrid')?.addEventListener('click', e => {
  const card = e.target.closest('.role-card');
  if (!card || card.closest('#teamGrid')) return;

  document.querySelectorAll('#roleGrid .role-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  selectedRole = card.dataset.role;

  // Show/hide team fields & photo
  const tf = document.getElementById('teamFields');
  const photoGroup = document.getElementById('photoGroup');
  const socialGroup = document.getElementById('socialGroup');

  if (tf) {
    if (selectedRole === 'team' || selectedRole === 'admin') {
      tf.classList.add('open');

      // Show photo upload for team/admin
      if (photoGroup) photoGroup.classList.add('show');

      // Show social links for team AND admin (faculty)
      if (socialGroup) {
        if (selectedRole === 'team' || selectedRole === 'admin') {
          socialGroup.style.display = 'block';
        } else {
          socialGroup.style.display = 'none';
        }
      }

      // Hide team/teamRole picker for admin — only phone needed
      const teamGroup  = document.getElementById('teamGrid')?.closest('.form-group');
      const roleGroup  = document.getElementById('teamRole')?.closest('.form-group');

      if (selectedRole === 'admin') {
        if (teamGroup) teamGroup.style.display = 'none';
        if (roleGroup) roleGroup.style.display = 'none';
      } else {
        if (teamGroup) teamGroup.style.display = '';
        if (roleGroup) roleGroup.style.display = '';
      }
    } else {
      tf.classList.remove('open');
      if (photoGroup) photoGroup.classList.remove('show');
      if (socialGroup) socialGroup.style.display = 'none';
      selectedTeam = '';
      selectedTeamRole = '';
      photoFile = null;
      updatePhotoPreview(null);
    }
  }
});

/* ── TEAM GRID ──────────────────────────────────────────── */
document.getElementById('teamGrid')?.addEventListener('click', e => {
  const card = e.target.closest('.team-opt');
  if (!card) return;

  document.querySelectorAll('.team-opt').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  selectedTeam = card.dataset.team;

  // Populate role dropdown based on selected team
  const sel = document.getElementById('teamRole');
  if (sel) {
    const roles = TEAM_ROLES[selectedTeam] || [];
    sel.innerHTML =
      '<option value="">— pick your role —</option>' +
      roles.map(r => `<option value="${r}">${r}</option>`).join('');
    selectedTeamRole = '';
  }

  // Show social links when team is selected
  const socialGroup = document.getElementById('socialGroup');
  if (socialGroup && (selectedRole === 'team' || selectedRole === 'admin')) {
    socialGroup.style.display = 'block';
  }
});

document.getElementById('teamRole')?.addEventListener('change', e => {
  selectedTeamRole = e.target.value;
});

/* ── PHOTO UPLOAD ───────────────────────────────────────── */
const photoPreview = document.getElementById('photoPreview');
const photoInput = document.getElementById('photoInput');

if (photoPreview) {
  photoPreview.addEventListener('click', () => photoInput?.click());
}

if (photoInput) {
  photoInput.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showBanner('Photo must be less than 5MB');
      photoInput.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      showBanner('Please select a valid image file');
      photoInput.value = '';
      return;
    }

    photoFile = file;
    updatePhotoPreview(file);
  });
}

function updatePhotoPreview(file) {
  if (!photoPreview) return;

  if (!file) {
    photoPreview.classList.remove('has-image');
    photoPreview.innerHTML = '<i class="fas fa-camera"></i><span>Click to upload</span>';
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    photoPreview.classList.add('has-image');
    photoPreview.innerHTML = `<img src="${e.target.result}" alt="Photo preview">`;
  };
  reader.readAsDataURL(file);
}

/* ── FORM SUBMIT ────────────────────────────────────────── */
document.getElementById('signupForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();

  const name     = document.getElementById('name')?.value.trim();
  const email    = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;
  const phone    = document.getElementById('phone')?.value.trim();
  const linkedin = document.getElementById('linkedin')?.value.trim() || '';
  const github   = document.getElementById('github')?.value.trim() || '';

  // Basic validation
  if (!name || !email || !password) {
    showBanner('Please fill in all fields.');
    return;
  }
  if (!selectedRole) {
    showBanner('Please select your role.');
    return;
  }
  if (password.length < 6) {
    showBanner('Password must be at least 6 characters.');
    return;
  }

  // Role-specific validation
  if (selectedRole === 'team' || selectedRole === 'admin') {
    if (!phone) { showBanner('Please enter your phone number.'); return; }
  }
  if (selectedRole === 'team') {
    if (!selectedTeam)     { showBanner('Please select your team.'); return; }
    if (!selectedTeamRole) { showBanner('Please select your role within the team.'); return; }
  }

  setLoading(true);

  try {
    // Use FormData for file upload
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', selectedRole);

    if (selectedRole === 'team' || selectedRole === 'admin') {
      formData.append('phone', phone);
    }

    if (selectedRole === 'team') {
      formData.append('team', selectedTeam);
      formData.append('teamRole', selectedTeamRole);
    }

    // Add optional fields
    if (photoFile) {
      formData.append('photo', photoFile);
    }
    if (linkedin) {
      formData.append('linkedin', linkedin);
    }
    if (github) {
      formData.append('github', github);
    }

    const res = await fetch('http://localhost:5000/api/auth/signup', {
      method:  'POST',
      body:    formData,
      // Don't set Content-Type header - browser will set it with boundary
    });

    const data = await res.json();
    console.log("Server response:", data);

    if (res.ok) {
      setLoading(false);

      // Show success overlay if it exists
      const overlay = document.getElementById('successOverlay');
      if (overlay) overlay.classList.add('show');

      // All roles redirect to login after signup
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);

    } else {
      throw new Error(data.message || 'Registration failed. Please try again.');
    }

  } catch (err) {
    console.error(err);
    showBanner(err.message || 'Server error. Make sure backend is running on port 5000.');
  } finally {
    setLoading(false);
  }
});