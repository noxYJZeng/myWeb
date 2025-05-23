const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll("#side-nav a");

window.addEventListener("scroll", () => {
  const isVisible = document.getElementById("main-content").style.display === "block";
  if (!isVisible) return;

  let current = "";
  sections.forEach((section) => {
    const sectionTop = section.offsetTop - 100;
    if (pageYOffset >= sectionTop) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href") === `#${current}`) {
      link.classList.add("active");
    }
  });
});
