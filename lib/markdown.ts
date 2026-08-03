function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Renders a small, safe subset of markdown to HTML: headers (#, ##),
 * bold (**text**), italic (*text*), bullet lists (- item), and line
 * breaks. Input is HTML-escaped first, so this is safe to dangerouslySetInnerHTML. */
export function renderMarkdownLite(source: string): string {
  const escaped = escapeHtml(source);
  const lines = escaped.split("\n");
  const html: string[] = [];
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine;
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)/);

    if (bulletMatch) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inline(bulletMatch[1])}</li>`);
      continue;
    }
    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    if (/^##\s+/.test(line)) {
      html.push(`<h3>${inline(line.replace(/^##\s+/, ""))}</h3>`);
    } else if (/^#\s+/.test(line)) {
      html.push(`<h2>${inline(line.replace(/^#\s+/, ""))}</h2>`);
    } else if (line.trim() === "") {
      html.push("<br/>");
    } else {
      html.push(`<p>${inline(line)}</p>`);
    }
  }
  if (inList) html.push("</ul>");

  return html.join("");
}

function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

export function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
