export function imageHtml(src: string, alt: string, width: number, height: number) {
  const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return `<img src="${escape(src)}" alt="${escape(alt)}" width="${width}" height="${height}">`;
}
