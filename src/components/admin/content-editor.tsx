"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { SafeHtmlPreview } from "@/components/admin/safe-html-preview";
import { ImageUpload } from "@/components/admin/image-upload";
import { confirmedAsset, mediaJson } from "@/lib/admin/media-upload";
import type { AdminMediaAsset } from "@/lib/admin/media-types";
import { imageHtml } from "@/lib/admin/editor-html";
import { useLeaveGuard } from "@/lib/admin/use-leave-guard";
import type {
  ContentItemState,
  ContentRevisionSnapshot,
  ContentType,
} from "@/server/content/domain";

type EditableFields = {
  title: string;
  summary: string;
  sourceHtml: string;
  coverMediaAssetId: string;
  coverAlt: string;
};

type ContentEditorDetail = {
  item: ContentItemState;
  draftRevision: ContentRevisionSnapshot | null;
  publishedRevision: ContentRevisionSnapshot | null;
};

const emptyFields: EditableFields = {
  title: "",
  summary: "",
  sourceHtml: "",
  coverMediaAssetId: "",
  coverAlt: "",
};

const configuration = {
  news: { label: "新闻", route: "news", publicRoute: "news" },
  case: { label: "案例", route: "cases", publicRoute: "cases" },
} as const;

function editable(detail: ContentEditorDetail): EditableFields {
  const source = detail.draftRevision ?? detail.publishedRevision ?? detail.item;
  return {
    title: source.title,
    summary: source.summary,
    sourceHtml: source.sourceHtml,
    coverMediaAssetId: source.coverMediaAssetId?.toString() ?? "",
    coverAlt: source.coverAlt ?? "",
  };
}

export function ContentEditor({
  contentType,
  itemId,
}: {
  contentType: ContentType;
  itemId?: number;
}) {
  const router = useRouter();
  const config = configuration[contentType];
  const [fields, setFields] = useState<EditableFields>(emptyFields);
  const [detail, setDetail] = useState<ContentEditorDetail | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [revisions, setRevisions] = useState<ContentRevisionSnapshot[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [confirmAuthorization, setConfirmAuthorization] = useState(false);
  const [savedFields, setSavedFields] = useState<EditableFields>(emptyFields);
  const [loading, setLoading] = useState(Boolean(itemId));
  const [coverAsset, setCoverAsset] = useState<AdminMediaAsset | null>(null);
  const [bodyPending, setBodyPending] = useState(false);
  const [coverPending, setCoverPending] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const navigationAllowed = useRef(false);
  const dirty = JSON.stringify(fields) !== JSON.stringify(savedFields);

  const pendingImages = bodyPending || coverPending;
  const navigationSupported = useLeaveGuard(dirty || busy || pendingImages, navigationAllowed);
  const editingDisabled = busy || loading || !navigationSupported || Boolean(itemId && !detail);

  const load = useCallback(async (isCurrent: () => boolean = () => true) => {
    if (!itemId) return;
    const response = await fetch(`/api/admin/content/${itemId}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const result = (await response.json()) as ContentEditorDetail & {
      message?: string;
    };
    if (!response.ok || !result.item) {
      throw new Error(result.message ?? "load");
    }
    if (result.item.contentType !== contentType) {
      throw new Error("type");
    }
    const nextFields = editable(result);
    let asset: AdminMediaAsset | null = null;
    if (nextFields.coverMediaAssetId) {
      try { asset = confirmedAsset((await mediaJson(`/api/admin/media/${nextFields.coverMediaAssetId}`, {})).asset); }
      catch { if (isCurrent()) setMessage("封面暂时无法预览，已保留原有绑定；可重新连接后重试。"); }
    }
    if (!isCurrent()) return;
    setDetail(result);
    setFields(nextFields);
    setSavedFields(nextFields);
    setCoverAsset(asset);
    navigationAllowed.current = false;
    setConflict(false);
  }, [contentType, itemId]);

  useEffect(() => {
    if (!itemId) return;
    let current = true;
    setLoading(true);
    load(() => current).catch(() => { if (current) setMessage("内容暂不可用，请返回列表后重试。"); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [itemId, load]);

  async function csrf() {
    const response = await fetch("/api/admin/auth/session", {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const result = (await response.json()) as { csrfToken?: string };
    if (!response.ok || !result.csrfToken) {
      throw new Error("会话不可用，请保留本页，在新标签页登录后重新连接。");
    }
    return result.csrfToken;
  }

  function focusFirstInvalid() {
    const order: Array<keyof EditableFields> = [
      "title",
      "summary",
      "sourceHtml",
    ];
    const first = order.find((name) => !fields[name].trim());
    if (!first) {
      const hasCoverId = fields.coverMediaAssetId.trim().length > 0;
      const hasCoverAlt = fields.coverAlt.trim().length > 0;
      if (hasCoverId !== hasCoverAlt) {
        const field = hasCoverId ? "coverAlt" : "coverMediaAssetId";
        setMessage("代表图媒体 ID 与替代文本必须同时填写或同时留空。");
        requestAnimationFrame(() => {
          document.getElementById(`content-${field}`)?.focus();
        });
        return false;
      }
      return true;
    }
    setMessage(`请填写${first === "sourceHtml" ? "正文" : first}。`);
    requestAnimationFrame(() => {
      document.getElementById(`content-${first}`)?.focus();
    });
    return false;
  }

  async function mutation(
    url: string,
    method: "POST" | "PUT",
    body: Record<string, unknown>,
  ) {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": await csrf(),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
    const result = (await response.json()) as {
      code?: string;
      message?: string;
      item?: ContentItemState;
      asset?: { publicUsageConfirmedAt?: string };
    };
    if (!response.ok) {
      if (result.code === "version_conflict") setConflict(true);
      throw new Error(response.status === 401 || response.status === 403 ? "会话不可用，请在新标签页登录后重新连接。" : result.message ?? "内容操作失败，请稍后重试。");
    }
    return result;
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || loading) return;
    if (!itemId && pendingImages) { setMessage("请先完成图片上传或放弃待处理图片，再创建草稿。"); return; }
    if (!focusFirstInvalid()) return;
    if (coverAsset && !coverAsset.publicUsageConfirmedAt) { setMessage("请先确认封面可公开使用，或移除封面。"); return; }
    setBusy(true);
    setMessage("");
    try {
      const body = { ...fields, contentType };
      if (!itemId) {
        const result = await mutation("/api/admin/content", "POST", body);
        if (!result.item) {
          throw new Error("内容已创建，但响应不完整；请返回列表重新载入。");
        }
        setMessage("草稿已创建。");
        navigationAllowed.current = true;
        setSavedFields(fields);
        router.replace(`/admin/${config.route}/${result.item.id}`);
        return;
      }
      await mutation(`/api/admin/content/${itemId}`, "PUT", {
        ...body,
        expectedVersion: detail?.item.version,
      });
      await load();
      setMessage("草稿已保存；当前公开版本未改变。");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "保存失败，表单内容已保留。",
      );
    } finally {
      setBusy(false);
    }
  }

  async function preview() {
    if (busy || loading) return;
    if (!focusFirstInvalid()) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/security/sanitize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": await csrf(),
        },
        body: JSON.stringify({ source: fields.sourceHtml }),
        signal: AbortSignal.timeout(15000),
      });
      const result = (await response.json()) as {
        html?: string;
        diagnostics?: { changed?: boolean };
      };
      if (!response.ok || typeof result.html !== "string") {
        throw new Error("安全预览暂不可用。");
      }
      setPreviewHtml(result.html);
      setMessage(
        result.diagnostics?.changed
          ? "预览已移除不允许的内容，原始输入仍保留。"
          : "预览已通过安全校验。",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "预览失败。");
    } finally {
      setBusy(false);
    }
  }

  async function confirmCoverPublicUsage() {
    const mediaAssetId = Number(fields.coverMediaAssetId);
    if (!Number.isSafeInteger(mediaAssetId) || mediaAssetId < 1) {
      setMessage("请先填写有效的代表图媒体 ID。");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await mutation("/api/admin/media/public-usage", "POST", { mediaAssetId });
      if (result.asset?.publicUsageConfirmedAt) setCoverAsset(current => current ? { ...current, publicUsageConfirmedAt: result.asset!.publicUsageConfirmedAt! } : current);
      setMessage("已确认封面可公开使用；请保存草稿。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "媒体公开使用确认失败。");
    } finally {
      setBusy(false);
    }
  }

  async function transition(action: "publish" | "offline" | "republish") {
    if (!itemId || !detail) return;
    if (busy || loading || dirty) { setMessage("请先保存当前修改，再执行发布或下线。"); return; }
    setBusy(true);
    setMessage("");
    try {
      const endpoint =
        action === "offline"
          ? `/api/admin/content/${itemId}/offline`
          : `/api/admin/content/${itemId}/publish`;
      await mutation(endpoint, "POST", {
        action,
        expectedVersion: detail.item.version,
        confirmCaseAuthorization:
          action === "publish" && confirmAuthorization,
      });
      await load();
      setMessage(
        action === "offline"
          ? "内容已下线；公开 URL 将返回 410。"
          : "内容已发布，精确缓存刷新已入队。",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "状态操作失败，表单内容已保留。",
      );
    } finally {
      setBusy(false);
    }
  }

  async function loadRevisions() {
    if (!itemId || historyLoading) return;
    setHistoryLoading(true);
    try {
      const result = await mediaJson(`/api/admin/content/${itemId}/revisions`, {}) as {
        revisions?: ContentRevisionSnapshot[];
      };
      if (!result.revisions) throw new Error("history");
      setRevisions(result.revisions);
      setMessage(`已读取 ${result.revisions.length} 个版本。`);
    } catch {
      setMessage("版本历史暂不可用，请稍后重试。当前输入已保留。");
    } finally {
      setHistoryLoading(false);
    }
  }

  function update(name: keyof EditableFields, value: string) {
    setPreviewHtml("");
    setFields((current) => ({ ...current, [name]: value }));
  }

  const item = detail?.item;
  const authorizationNeeded =
    contentType === "case" &&
    item?.caseAuthorizationConfirmedAt == null &&
    item?.publicStatus === "draft";

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <Link
              className="text-sm underline underline-offset-4"
              href={`/admin/${config.route}`}
            >
              返回{config.label}列表
            </Link>
            <h1 className="mt-3 text-3xl font-semibold">
              {itemId ? `编辑${config.label}` : `新建${config.label}`}
            </h1>
          </div>
          {item ? (
            <dl className="grid min-w-0 grid-cols-2 gap-x-5 gap-y-2 rounded-md border border-black/15 bg-white p-4 text-sm">
              <dt className="text-black/55">公开状态</dt>
              <dd>{{ draft: "草稿", published: "已发布", offline: "已下线" }[item.publicStatus]}</dd>
              <dt className="text-black/55">版本</dt>
              <dd>{item.version}</dd>
              <dt className="text-black/55">草稿版本</dt>
              <dd>{item.draftRevisionId ?? "—"}</dd>
              <dt className="text-black/55">已发布版本</dt>
              <dd>{item.publishedRevisionId ?? "—"}</dd>
            </dl>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          {!navigationSupported ? <p role="alert">此浏览器无法保护未保存内容，编辑已暂停。请使用最新版 Chrome、Edge、Firefox 或 Safari 打开本页。</p> : null}
          <span role="status">{loading ? "正在载入…" : dirty ? "有未保存的修改，请先保存草稿。" : "当前内容已保存。"}</span>
          {pendingImages ? <span role="status">有待完成的图片操作，请上传、重试确认或放弃。</span> : null}
          <a href="/admin/login" target="_blank" rel="noopener noreferrer" className="min-h-11 content-center underline">在新标签页登录</a>
          <button type="button" disabled={busy || loading} className="min-h-11 rounded border border-black/20 px-3 disabled:opacity-40" onClick={async () => {
            setBusy(true);
            try { await csrf(); setMessage("会话已重新连接，当前输入已保留，可继续保存或重试确认图片。"); }
            catch { setMessage("会话不可用，请先在新标签页登录，再回到此页重新连接。"); }
            finally { setBusy(false); }
          }}>重新连接会话</button>
        </div>

        {conflict ? (
          <div
            className="mt-7 rounded-md border border-red-700 bg-red-50 p-5"
            role="alert"
          >
            <strong>服务器内容已变化。</strong>
            <p className="mt-2 text-sm">
              当前表单仍保留在浏览器中。可以先复制比较，也可以重新载入服务器版本。
            </p>
            <button
              className="mt-3 min-h-11 rounded-md border border-red-700 px-4"
              disabled={busy || loading}
              onClick={async () => {
                if (!window.confirm("重新载入会替换当前未保存内容，确定继续？")) return;
                setBusy(true);
                try { await load(); } catch { setMessage("重新载入失败，表单内容已保留。"); } finally { setBusy(false); }
              }}
              type="button"
            >
              重新载入服务器版本
            </button>
          </div>
        ) : null}

        <div className="mt-8 grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <form className="grid min-w-0 gap-5" onSubmit={save}>
            <fieldset disabled={editingDisabled} className="contents">
            <label className="grid min-w-0 gap-2" htmlFor="content-title">
              <span>标题（1～160 字符）</span>
              <input
                className="w-full min-w-0 rounded-md border border-black/20 bg-white px-4 py-3"
                id="content-title"
                maxLength={160}
                onChange={(event) => update("title", event.target.value)}
                required
                value={fields.title}
              />
            </label>
            <label className="grid min-w-0 gap-2" htmlFor="content-summary">
              <span>摘要（1～320 字符）</span>
              <textarea
                className="min-h-28 w-full min-w-0 rounded-md border border-black/20 bg-white px-4 py-3"
                id="content-summary"
                maxLength={320}
                onChange={(event) => update("summary", event.target.value)}
                required
                value={fields.summary}
              />
            </label>
            <div className="grid min-w-0 gap-2">
              <span>链接路径（自动生成）</span>
              {item ? (
                <p className="min-w-0 break-all rounded-md border border-black/20 bg-white px-4 py-3 font-mono">
                  /{config.publicRoute}/{item.slug}
                </p>
              ) : (
                <p className="text-sm text-black/65">链接将在保存草稿后自动生成</p>
              )}
            </div>
            <label className="grid min-w-0 gap-2" htmlFor="content-sourceHtml">
              <span>HTML 正文</span>
              <textarea
                className="min-h-80 w-full min-w-0 rounded-md border border-black/20 bg-white p-4 font-mono text-sm"
                disabled={editingDisabled}
                id="content-sourceHtml"
                maxLength={500000}
                onChange={(event) => update("sourceHtml", event.target.value)}
                required
                value={fields.sourceHtml}
              />
            </label>
            <p className="text-sm text-black/60">直接编辑 HTML 源码；安全预览、保存和发布时会进行服务端净化。图片通过下方上传添加。</p>
            <ImageUpload purpose="body" onPendingChange={setBodyPending} disabled={editingDisabled} csrf={csrf} onBusy={setBusy} onUploaded={(asset, alt) => {
              setPreviewHtml("");
              setFields(current => ({ ...current, sourceHtml: `${current.sourceHtml}${imageHtml(asset.publicUrl, alt, asset.width, asset.height)}` }));
            }} />

            <fieldset className="grid min-w-0 grid-cols-1 gap-4 rounded-md border border-black/15 bg-white p-4">
              <legend className="px-2 font-semibold">可选代表图</legend>
              <p className="text-sm text-black/65">
                封面随文章版本发布；更换封面不会立即修改已公开的新闻。
              </p>
              <ImageUpload purpose="cover" onPendingChange={setCoverPending} disabled={editingDisabled} csrf={csrf} onBusy={setBusy} onUploaded={(asset, alt) => {
                setCoverAsset(asset);
                setFields(current => ({ ...current, coverMediaAssetId: String(asset.id), coverAlt: alt }));
              }} />
              {coverAsset ? <div className="grid min-w-0 grid-cols-1 gap-2">
                {/* Confirmed ESA URL; no temporary upload URL is ever rendered. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverAsset.publicUrl} alt={fields.coverAlt} width={coverAsset.width} height={coverAsset.height} className="block h-auto max-h-56 w-full min-w-0 max-w-full rounded object-contain" />
                <p className="text-sm">{coverAsset.width}×{coverAsset.height} · {Math.ceil(coverAsset.byteSize / 1024)} KB · {coverAsset.publicUsageConfirmedAt ? "已确认可公开使用" : "待确认公开使用"}</p>
              </div> : fields.coverMediaAssetId ? <p className="text-sm">原有封面绑定已保留，暂无法显示预览。</p> : null}
              <label className="grid min-w-0 gap-2" htmlFor="content-coverAlt">
                <span>替代文本（1～240 字符，不使用文件名）</span>
                <input
                  className="w-full min-w-0 rounded-md border border-black/20 px-4 py-3"
                  id="content-coverAlt"
                  maxLength={240}
                  onChange={(event) => update("coverAlt", event.target.value)}
                  value={fields.coverAlt}
                />
              </label>
              <button
                className="min-h-11 justify-self-start rounded-md border border-black px-4 py-2"
                disabled={busy || !fields.coverMediaAssetId || Boolean(coverAsset?.publicUsageConfirmedAt)}
                onClick={confirmCoverPublicUsage}
                type="button"
              >
                确认该媒体可公开使用
              </button>
              {fields.coverMediaAssetId ? <button type="button" className="min-h-11 justify-self-start rounded border border-black/20 px-4" onClick={() => {
                setCoverAsset(null); setFields(current => ({ ...current, coverMediaAssetId: "", coverAlt: "" }));
              }}>移除封面</button> : null}
            </fieldset>

            {authorizationNeeded ? (
              <label className="grid grid-cols-[20px_minmax(0,1fr)] gap-3 rounded-md border border-amber-700 bg-amber-50 p-4">
                <input
                  checked={confirmAuthorization}
                  className="mt-1 h-4 w-4"
                  onChange={(event) =>
                    setConfirmAuthorization(event.target.checked)
                  }
                  type="checkbox"
                />
                <span className="text-sm">
                  我确认该案例已获得本次首次公开所需授权。此记录是 item-level
                  人工门禁，不构成法律意见或逐 revision 法律审批。
                </span>
              </label>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                className="min-h-11 rounded-md cta--product-primary px-5 py-2 text-white disabled:opacity-55"
                disabled={busy}
                type="submit"
              >
                {itemId ? "保存草稿" : "创建草稿"}
              </button>
              <button
                className="min-h-11 rounded-md border border-black px-5 py-2"
                disabled={busy}
                onClick={preview}
                type="button"
              >
                安全预览
              </button>
              {item?.publicStatus === "draft" ||
              (item?.publicStatus === "published" &&
                item.draftRevisionId !== null) ? (
                <button
                  className="min-h-11 rounded-md border border-green-800 px-5 py-2 text-green-900"
                  disabled={busy || dirty || (authorizationNeeded && !confirmAuthorization)}
                  onClick={() => transition("publish")}
                  type="button"
                >
                  {item.publicStatus === "published" ? "发布草稿更新" : "发布"}
                </button>
              ) : null}
              {item?.publicStatus === "published" ? (
                <button
                  className="min-h-11 rounded-md border border-red-700 px-5 py-2 text-red-800"
                  disabled={busy || dirty}
                  onClick={() => transition("offline")}
                  type="button"
                >
                  下线
                </button>
              ) : null}
              {item?.publicStatus === "offline" ? (
                <button
                  className="min-h-11 rounded-md border border-green-800 px-5 py-2 text-green-900"
                  disabled={busy || dirty}
                  onClick={() => transition("republish")}
                  type="button"
                >
                  重新发布
                </button>
              ) : null}
            </div>
            <p aria-live="polite" className="min-h-7 text-sm text-black/70">
              {message}
            </p>
            </fieldset>
          </form>

          <aside className="min-w-0">
            <h2 className="text-xl font-semibold">安全预览</h2>
            <div className="mt-3">
              {previewHtml ? (
                <SafeHtmlPreview html={previewHtml} />
              ) : (
                <p className="rounded-md border border-black/15 bg-white p-5 text-sm text-black/60">
                  点击“安全预览”查看净化后的正文效果。
                </p>
              )}
            </div>

            {item?.publishedRevisionId ? (
              <div className="mt-7 rounded-md border border-black/15 bg-white p-5 text-sm">
                <h2 className="font-semibold">当前公开版本</h2>
                <p className="mt-2 break-all">
                  Revision {item.publishedRevisionId} ·{" "}
                  <a
                    className="underline underline-offset-4"
                    href={`/${config.publicRoute}/${item.slug}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    查看公开 URL
                  </a>
                </p>
              </div>
            ) : null}

            {contentType === "case" && item ? (
              <div className="mt-7 rounded-md border border-amber-700 bg-amber-50 p-5 text-sm">
                <h2 className="font-semibold">案例授权记录</h2>
                <p className="mt-2">
                  {item.caseAuthorizationConfirmedAt
                    ? `已确认；首次公开 revision ${item.caseAuthorizationRevisionId ?? "—"}，管理员 ${item.caseAuthorizationAdminId ?? "—"}。`
                    : "尚未确认，首次发布将被阻止。"}
                </p>
                <p className="mt-2">该记录不构成法律意见。</p>
              </div>
            ) : null}

            {itemId ? (
              <div className="mt-7">
                <button
                  className="min-h-11 rounded-md border border-black px-4 py-2"
                  disabled={historyLoading}
                  onClick={loadRevisions}
                  type="button"
                >
                  {historyLoading ? "正在读取版本历史…" : "查看版本历史"}
                </button>
                {revisions.length ? (
                  <ol className="mt-4 grid gap-2 p-0 text-sm">
                    {revisions.map((revision) => (
                      <li
                        className="list-none rounded-md border border-black/15 bg-white p-3"
                        key={revision.id}
                      >
                        #{revision.revisionNumber} · {revision.status} ·{" "}
                        {new Date(revision.createdAt).toLocaleString("zh-CN")}
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
