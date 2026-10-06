import { parseDocument } from "htmlparser2";
type AnyNode = ReturnType<typeof parseDocument>["children"][number];

const tags = new Set(["p", "h2", "h3", "h4", "strong", "em", "ul", "ol", "li", "a", "br", "img", "blockquote", "pre", "code"]);
const attributes: Record<string, string[]> = { a: ["href", "title", "target", "rel"], img: ["src", "alt", "title", "width", "height"] };

export function safeEditorLink(value: string) {
  if (!/^(https:\/\/|mailto:)/i.test(value) || /[\s\u0000-\u001f]/.test(value)) return false;
  try {
    const url = new URL(value);
    return !url.username && !url.password && (url.protocol === "https:" || (url.protocol === "mailto:" && /^[^/?#]+@[^/?#]+$/.test(url.pathname) && !url.search && !url.hash));
  } catch { return false; }
}

function nodes(html: string) { return parseDocument(html, { decodeEntities: true }).children; }

// Pure parser: unlike browser HTML parsing, no elements or image requests are created.
export function safeVisualHtml(html: string, approvedImages: readonly string[]): boolean {
  if (html.length > 500000) return false;
  const visit = (node: AnyNode): boolean => {
    if (node.type === "text") return true;
    if (node.type !== "tag" || !tags.has(node.name)) return false;
    const allowed = attributes[node.name] ?? [];
    if (Object.keys(node.attribs).some(name => !allowed.includes(name))) return false;
    if (node.name === "a" && (!safeEditorLink(node.attribs.href ?? "") || (node.attribs.target && !["_blank", "_self"].includes(node.attribs.target)))) return false;
    if (node.name === "img" && !approvedImages.includes(node.attribs.src)) return false;
    return node.children.every(visit);
  };
  try { return nodes(html).every(visit); } catch { return false; }
}

export function htmlImageSources(html: string): string[] {
  const result: string[] = [];
  const visit = (node: AnyNode) => {
    if (node.type !== "tag") return;
    if (node.name === "img" && node.attribs.src?.startsWith("https://")) result.push(node.attribs.src);
    node.children.forEach(visit);
  };
  nodes(html).forEach(visit);
  return result;
}

export function equivalentEditorHtml(left: string, right: string) {
  const canonical = (html: string) => {
    const visit = (node: AnyNode): unknown => {
      if (node.type === "text") return node.data;
      if (node.type !== "tag") return [node.type];
      const attrs = Object.entries(node.attribs)
        .filter(([name, value]) => value !== "" && !(node.name === "a" && name === "rel"))
        .sort(([a], [b]) => a.localeCompare(b));
      return [node.name, attrs, node.children.map(visit)];
    };
    return JSON.stringify(nodes(html.trim()).map(visit));
  };
  return canonical(left) === canonical(right);
}

export function imageHtml(src: string, alt: string, width: number, height: number) {
  const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return `<img src="${escape(src)}" alt="${escape(alt)}" width="${width}" height="${height}">`;
}
