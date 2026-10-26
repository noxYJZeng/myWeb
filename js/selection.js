"use strict";

// Native CSS selection; the lighter only tracks whether text is selected.
(() => {
  const root = document.documentElement;
  function update() {
    const selection = document.getSelection();
    root.classList.toggle(
      "has-text-selection",
      Boolean(
        selection && !selection.isCollapsed && selection.toString().trim(),
      ),
    );
  }
  document.addEventListener("selectionchange", update);
  update();
})();
