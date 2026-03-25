const searchInput = document.getElementById("searchInput");
const cards = document.querySelectorAll(".resource-card");

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();

  cards.forEach(card => {
    const title = card.querySelector("h3").innerText.toLowerCase();
    card.style.display = title.includes(query) ? "block" : "none";
  });
});