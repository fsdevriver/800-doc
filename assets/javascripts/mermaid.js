// Dynamic Theme-Aware Mermaid Render Engine for Material for MkDocs

function getActiveMermaidTheme() {
  const palette = __md_get("__palette");
  if (palette && typeof palette.color === "object") {
    return palette.color.scheme === "slate" ? "dark" : "default";
  }
  const isDark = document.body.getAttribute("data-md-color-scheme") === "slate";
  return isDark ? "dark" : "default";
}

function initMermaidDiagrams() {
  if (typeof mermaid === "undefined") return;

  const currentTheme = getActiveMermaidTheme();

  mermaid.initialize({
    startOnLoad: false,
    theme: currentTheme,
    themeVariables: currentTheme === "dark" ? {
      textColor: "#f8fafc",
      primaryTextColor: "#f8fafc",
      secondaryTextColor: "#cbd5e1",
      tertiaryTextColor: "#94a3b8",
      lineColor: "#94a3b8",
      actorTextColor: "#f8fafc",
      actorLineColor: "#818cf8",
      signalColor: "#f8fafc",
      signalTextColor: "#f8fafc",
      labelTextColor: "#f8fafc",
      loopTextColor: "#f8fafc",
      noteTextColor: "#0f172a",
      activationBorderColor: "#38bdf8",
      sequenceNumberColor: "#ffffff"
    } : {},
    securityLevel: "loose"
  });

  const elements = document.querySelectorAll("div.mermaid, .mermaid");
  elements.forEach((el, index) => {
    // Check if re-render needed due to theme change or unrendered
    if (el.dataset.renderedTheme === currentTheme && el.querySelector("svg")) return;

    if (!el.dataset.mermaidCode) {
      el.dataset.mermaidCode = el.textContent.trim();
    }
    const code = el.dataset.mermaidCode;
    if (!code) return;

    const id = "mermaid-chart-" + Math.random().toString(36).substring(2, 9) + "-" + index;
    
    mermaid.render(id, code)
      .then(({ svg }) => {
        el.innerHTML = svg;
        el.dataset.renderedTheme = currentTheme;
      })
      .catch((e) => {
        console.warn("Mermaid render notice:", e);
      });
  });
}

function initMath() {
  if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
    MathJax.typesetPromise();
  }
}

function runAll() {
  initMermaidDiagrams();
  initMath();
}

// 1. Hook into document$ (Material for MkDocs instant-navigation observable)
if (typeof document$ !== "undefined") {
  document$.subscribe(runAll);
} else {
  document.addEventListener("DOMContentLoaded", runAll);
}

// 2. Listen to Dark/Light theme toggle switch in Material header
const observer = new MutationObserver((mutations) => {
  mutations.forEach((m) => {
    if (m.attributeName === "data-md-color-scheme") {
      // Theme changed, re-render diagrams with the new theme
      setTimeout(runAll, 50);
    }
  });
});

observer.observe(document.body, { attributes: true });

window.addEventListener("load", runAll);
