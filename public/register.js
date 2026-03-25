document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const data = Object.fromEntries(new FormData(form));

  const res = await fetch("/api/students/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const result = await res.json();
  document.getElementById("msg").innerText = result.message;
});
