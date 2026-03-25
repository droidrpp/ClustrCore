/* ============================================================
   CLUSTR CORE — EVENTS PAGE JS
   ============================================================ */
function H() {
  return {
    "x-user-id": localStorage.getItem("userId")
  };
}

document.addEventListener('DOMContentLoaded', () => {

  const searchInput = document.getElementById('searchInput');
  const grid        = document.getElementById('eventsGrid'); // see note below

  /* ── CLICK — use event delegation so dynamic cards work ── */
  document.addEventListener('click', e => {
    const card = e.target.closest('.event-card');
    if (!card) return;
    // Replace alert with whatever you want — open modal, go to detail page, etc.
    const title = card.querySelector('h3')?.innerText;
    console.log('Event clicked:', title);
    // e.g. window.location.href = `/event-detail.html?id=${card.dataset.id}`;
  });

  /* ── SEARCH — also delegated, runs on every keystroke ──── */
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();

      // Query AFTER cards are in the DOM
      document.querySelectorAll('.event-card').forEach(card => {
        const title = card.querySelector('h3')?.innerText.toLowerCase() || '';
        const desc  = card.querySelector('.event-desc')?.innerText.toLowerCase() || '';
        const match = title.includes(query) || desc.includes(query);
        card.style.display = match ? '' : 'none';
      });
    });
  }

});