"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { generateHTML, generateJSON } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import { equivalentEditorHtml, safeEditorLink, safeVisualHtml } from "@/lib/admin/editor-html";

const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3, 4] }, horizontalRule: false, strike: false, underline: false,
    trailingNode: false,
    link: { openOnClick: false, autolink: false, linkOnPaste: false, isAllowedUri: safeEditorLink, HTMLAttributes: { target: null, rel: "noopener noreferrer" } },
  }),
  ImageExtension.configure({ allowBase64: false, resize: false }),
];

export default function RichTextEditor({ value, onChange, approvedImages, disabled }: {
  value: string; onChange: (value: string) => void; approvedImages: string[]; disabled: boolean;
}) {
  const [mode, setMode] = useState<"visual" | "source">("visual");
  const [notice, setNotice] = useState("");
  const [link, setLink] = useState("");
  const emitted = useRef<string | null>(null);
  const latestChange = useRef(onChange);
  latestChange.current = onChange;
  const editor = useEditor({
    extensions, immediatelyRender: false, content: "", editable: !disabled,
    enableInputRules: false, enablePasteRules: false,
    editorProps: {
      attributes: { id: "content-sourceHtml", role: "textbox", "aria-label": "正文", "aria-multiline": "true", class: "min-h-80 p-4 outline-none break-words [&_h2]:text-2xl [&_h3]:text-xl [&_h4]:text-lg [&_p]:my-3 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_img]:max-w-full [&_img]:h-auto [&_a]:underline [&_pre]:whitespace-pre-wrap" },
      handlePaste(view, event) {
        event.preventDefault();
        const text = event.clipboardData?.getData("text/plain") ?? "";
        if (text) view.dispatch(view.state.tr.insertText(text));
        return true;
      },
      handleDrop: () => true,
      handleClick: (_view, _pos, event) => {
        if (!(event.target as Element)?.closest("a")) return false;
        event.preventDefault(); return true;
      },
    },
    onUpdate({ editor: current }) {
      const html = current.getHTML();
      emitted.current = html;
      latestChange.current(html);
    },
  });

  useEffect(() => { editor?.setEditable(!disabled, false); }, [editor, disabled]);

  const loadVisual = () => {
    if (!editor || !safeVisualHtml(value, approvedImages)) return false;
    try {
      const parsed = generateJSON(value, extensions);
      if (value.trim() && !equivalentEditorHtml(value, generateHTML(parsed, extensions))) return false;
      editor.commands.setContent(parsed, { emitUpdate: false });
      return true;
    } catch { return false; }
  };

  useEffect(() => {
    if (!editor || value === emitted.current) return;
    if (!loadVisual()) {
      setMode("source");
      setNotice("这篇正文包含特殊格式或尚未确认的图片，已保留 HTML 原文。可继续编辑源码并安全预览。");
    }
    // Parsing never writes back normalized HTML. Only actual editor updates emit changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value, approvedImages]);

  const buttonClass = "min-h-11 rounded border border-black/20 px-3 text-sm disabled:opacity-40";
  return <div className="grid min-w-0 gap-3">
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-auto font-semibold">正文</span>
      <button className={buttonClass} type="button" disabled={disabled || mode === "visual"} onClick={() => {
        if (loadVisual()) { setMode("visual"); setNotice(""); }
        else setNotice("当前格式无法无损切换，原文已保留。请继续使用 HTML 模式。");
      }}>可视化编辑</button>
      <button className={buttonClass} type="button" disabled={disabled || mode === "source"} onClick={() => setMode("source")}>HTML 高级模式</button>
    </div>
    {notice ? <p role="status" className="text-sm text-amber-900">{notice}</p> : null}
    {mode === "source" ? <label className="grid min-w-0 gap-2">
      <span>HTML 正文</span><textarea id="content-sourceHtml" value={value} onChange={e => { emitted.current = null; onChange(e.target.value); }} disabled={disabled} maxLength={500000} required className="min-h-80 w-full min-w-0 rounded border border-black/20 p-4 font-mono text-sm" />
    </label> : <div className="min-w-0 rounded border border-black/20 bg-white">
      <div aria-label="正文格式" className="flex flex-wrap gap-2 border-b border-black/15 p-3">
        {([
          ["段落", () => editor?.chain().focus().setParagraph().run()],
          ["小标题", () => editor?.chain().focus().toggleHeading({ level: 2 }).run()],
          ["粗体", () => editor?.chain().focus().toggleBold().run()],
          ["斜体", () => editor?.chain().focus().toggleItalic().run()],
          ["无序列表", () => editor?.chain().focus().toggleBulletList().run()],
          ["有序列表", () => editor?.chain().focus().toggleOrderedList().run()],
          ["撤销", () => editor?.chain().focus().undo().run()],
          ["重做", () => editor?.chain().focus().redo().run()],
        ] as const).map(([label, action]) => <button key={label} type="button" className={buttonClass} disabled={disabled || !editor} onClick={action}>{label}</button>)}
        <div className="flex w-full min-w-0 flex-wrap gap-2">
          <input aria-label="链接地址" placeholder="https://… 或 mailto:…" className="min-h-11 min-w-0 flex-1 rounded border border-black/20 px-3" value={link} onChange={e => setLink(e.target.value)} disabled={disabled} />
          <button className={buttonClass} type="button" disabled={disabled || !editor} onClick={() => {
            if (!safeEditorLink(link)) { setNotice("链接必须为有效 HTTPS 或邮箱地址。"); return; }
            editor?.chain().focus().extendMarkRange("link").setLink({ href: link }).run(); setNotice("");
          }}>设置链接</button>
          <button className={buttonClass} type="button" disabled={disabled || !editor} onClick={() => editor?.chain().focus().unsetLink().run()}>移除链接</button>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>}
    <p className="text-sm text-black/60">粘贴仅保留文字。图片通过下方上传添加，预览和发布时会再次安全校验。</p>
  </div>;
}
