"use strict";

// Content and anchor navigation also work without JavaScript.
document.getElementById("year").textContent = new Date().getFullYear();

const sectionLinks = [...document.querySelectorAll('nav a[href^="#"]')];
const sections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const link of sectionLinks) {
        const active = link.getAttribute("href") === `#${entry.target.id}`;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
    }
  },
  { rootMargin: "-15% 0px -50% 0px" },
);
sections.forEach((section) => observer.observe(section));

// Rotate in one heading, retaining the shared prefix between messages.
// Keep a full, static greeting available without JavaScript and for reduced motion.
(() => {
  const heading = document.getElementById("hero-title");
  const firstWord = document.querySelector(".headline-first-word");
  const rest = document.querySelector(".headline-rest");
  const cursor = document.querySelector(".headline-cursor");
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const messages = [
    "Hi, I’m Nox.",
    "I write code and paint watercolors.",
    "I build things that make me smile.",
    "I love clean syntax and late-night snacks.",
    "I fix bugs with my tea and optimism.",
    "I believe side projects are self-care.",
    "I chase elegant logic—and good lighting.",
    "I'm happiest when I'm building something new.",
    "I'm still learning — and that's the point.",
  ];
  let reduced = preference.matches;
  let visible = true;
  let messageIndex = 0;
  let count = 0;
  let deleting = false;
  let timer = null;
  let introPending =
    document.documentElement.classList.contains("intro-active");

  function draw() {
    heading.dataset.kind = messageIndex === 0 ? "greeting" : "phrase";
    heading.setAttribute("aria-label", messages[messageIndex]);
    const message = messages[messageIndex];
    const firstWordLength = message.match(/^\S+/)[0].length;
    const visibleText = message.slice(0, count);
    const visibleFirstWord = visibleText.slice(0, firstWordLength);
    const visibleRest = visibleText.slice(firstWordLength);
    // Leave the white word's text node untouched while the suffix changes.
    if (firstWord.textContent !== visibleFirstWord)
      firstWord.textContent = visibleFirstWord;
    if (rest.textContent !== visibleRest) rest.textContent = visibleRest;
    cursor.hidden = reduced;
  }
  function showStatic() {
    messageIndex = 0;
    count = messages[0].length;
    deleting = true;
    draw();
  }
  function schedule(delay = 140) {
    clearTimeout(timer);
    if (!introPending && !reduced && visible && !document.hidden)
      timer = setTimeout(step, delay);
  }
  function commonPrefixLength(current, next) {
    let length = 0;
    while (
      length < current.length &&
      length < next.length &&
      current[length] === next[length]
    )
      length++;
    return length;
  }
  function step() {
    if (reduced || !visible || document.hidden) return;
    let delay;
    if (deleting) {
      const nextIndex = (messageIndex + 1) % messages.length;
      const retained = commonPrefixLength(
        messages[messageIndex],
        messages[nextIndex],
      );
      count = Math.max(retained, count - 1);
      delay = 30;
      if (count === retained) {
        messageIndex = nextIndex;
        deleting = count === messages[messageIndex].length;
        delay = deleting ? 2200 : 400;
      }
    } else {
      count++;
      delay = 65;
      if (count === messages[messageIndex].length) {
        deleting = true;
        delay = 2200;
      }
    }
    draw();
    schedule(delay);
  }
  preference.addEventListener("change", (event) => {
    reduced = event.matches;
    if (reduced) showStatic();
    else draw();
    schedule();
  });
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    schedule();
  }).observe(document.querySelector(".hero-copy"));
  document.addEventListener("visibilitychange", () => schedule());
  document.addEventListener(
    "intro:reveal",
    () => {
      introPending = false;
      schedule(160);
    },
    { once: true },
  );
  if (reduced) showStatic();
  else draw();
  schedule(350);
})();
