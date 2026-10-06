const PREVIEW_CSP =
  "default-src 'none'; img-src https:; style-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'";

function previewDocument(html: string) {
  return [
    "<!doctype html>",
    '<html lang="zh-CN">',
    "<head>",
    '<meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">`,
    '<meta name="referrer" content="no-referrer">',
    "</head>",
    `<body>${html}</body>`,
    "</html>",
  ].join("");
}

export function SafeHtmlPreview({ html }: { html: string }) {
  return (
    <iframe
      sandbox=""
      referrerPolicy="no-referrer"
      srcDoc={previewDocument(html)}
      title="净化后的内容预览"
    />
  );
}
