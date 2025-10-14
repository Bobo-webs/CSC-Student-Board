document.addEventListener("DOMContentLoaded", function () {
  const menuBtn = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".admin-nav");

  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener("click", function (e) {
    e.stopPropagation(); // avoid clicks leaking
    navLinks.classList.toggle("show-menu");
  });

  // Close menu when clicking outside
  document.addEventListener("click", function (e) {
    if (!navLinks.classList.contains("show-menu")) return;
    if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
      navLinks.classList.remove("show-menu");
    }
  });

  // Close on escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") navLinks.classList.remove("show-menu");
  });
});

document.querySelectorAll(".admin-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    document.getElementById("nav-links").classList.remove("active");
  });
});
