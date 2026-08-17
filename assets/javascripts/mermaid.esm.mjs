// Official MkDocs Material Mermaid integration pattern
import mermaid from "https://unpkg.com/mermaid@11/dist/mermaid.esm.min.mjs";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose"
});

async function renderMermaid() {
  const elements = document.querySelectorAll(".mermaid:not([data-processed='true'])");
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    el.setAttribute("data-processed", "true");
    const code = el.textContent.trim();
    const id = "mermaid-svg-" + Math.random().toString(36).substring(2, 9) + "-" + i;
    try {
      const { svg } = await mermaid.render(id, code);
      el.innerHTML = svg;
    } catch (err) {
      console.warn("Mermaid error:", err);
    }
  }
}

if (typeof document$ !== "undefined") {
  document$.subscribe(() => {
    renderMermaid();
  });
} else {
  document.addEventListener("DOMContentLoaded", renderMermaid);
}
