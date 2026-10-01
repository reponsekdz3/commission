"use client";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Paperclip, X, ArrowLeft, ExternalLink } from "lucide-react";
import { authApi } from "../../lib/api";
import { trackEvent } from "../../lib/analytics";
import { EmptyState } from "../../components/empty-state";

type Attachment = { id: string; filename: string; contentType: string; sizeBytes: number };

export default function Messages() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [active, setActive] = useState<any>();
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function load() {
    try { setConversations(await authApi<any[]>("/messages/conversations")); }
    catch (e: any) { setErr(e.message); }
  }

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages]);

  async function open(id: string) {
    try {
      const c = await authApi<any>("/messages/conversations/" + id);
      setActive(c);
      await authApi("/messages/" + id + "/read", { method: "POST" });
    } catch (e: any) { setErr(e.message); }
  }

  async function upload(files: FileList | null) {
    if (!active || !files?.length) return;
    setUploading(true); setErr("");
    try {
      for (const file of Array.from(files)) {
        if (file.size > 50 * 1024 * 1024) throw new Error(file.name + " exceeds the 50 MB attachment limit");
        const signed = await authApi<any>("/messages/attachments/signed-url", {
          method: "POST", body: JSON.stringify({ conversationId: active.id, filename: file.name, contentType: file.type, sizeBytes: file.size }),
        });
        const put = await fetch(signed.uploadUrl, { method: "PUT", headers: signed.headers || { "Content-Type": file.type }, body: file });
        if (!put.ok) throw new Error("Upload failed: " + file.name);
        const done = await authApi<Attachment>("/messages/attachments/complete", {
          method: "POST", body: JSON.stringify({ conversationId: active.id, key: signed.key, filename: file.name, contentType: file.type }),
        });
        setAttachments(x => [...x, done]);
      }
    } catch (e: any) { setErr(e.message || "Attachment upload failed"); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function openAttachment(id: string) {
    try {
      const r = await authApi<any>("/messages/attachments/" + id + "/download");
      if (r.downloadUrl) window.open(r.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) { setErr(e.message); }
  }

  async function send() {
    if (!active || (!body.trim() && !attachments.length) || sending) return;
    setSending(true); setErr("");
    try {
      await authApi("/messages", { method: "POST", body: JSON.stringify({ conversationId: active.id, body: body.trim() || "Attachment", attachmentIds: attachments.map(x => x.id) }) });
      trackEvent("message_send", { conversation_id: active.id, has_attachments: attachments.length > 0 });
      setBody(""); setAttachments([]);
      await open(active.id); await load();
    } catch (e: any) { setErr(e.message); }
    finally { setSending(false); }
  }

  return (
    <main className="wrap section">
      <div className="mb-6">
        <div className="eyebrow mb-2">Realtime messaging</div>
        <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-[900] tracking-[-0.05em] leading-tight">Inbox.</h1>
        <p className="text-[var(--color-fg-muted)] text-sm mt-1">
          Persisted conversations with authenticated delivery, read state and private attachments.
        </p>
      </div>

      {err && <div className="alert alert-error mb-4">{err}</div>}

      {/* Split layout */}
      <div className="grid gap-0 overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-2)]"
        style={{ gridTemplateColumns: active ? "300px 1fr" : "1fr", minHeight: 560 }}>

        {/* Conversations sidebar */}
        <div className={`
          border-r border-[var(--color-border)] bg-[var(--color-surface-1)] flex flex-col
          ${active ? "hidden sm:flex" : "flex"}
        `}>
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <span className="font-[800] text-sm">Conversations</span>
            <span className="badge badge-gray">{conversations.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length ? (
              conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => void open(c.id)}
                  className={`
                    w-full text-left px-4 py-3 border-b border-[var(--color-border)] transition-colors
                    hover:bg-[var(--color-surface-2)]
                    ${active?.id === c.id ? "bg-[var(--color-primary-soft)]" : ""}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-[800] text-sm">
                      {(c.title || c.otherUserName || "C")[0].toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="font-[700] text-sm truncate">{c.title || c.otherUserName || "Conversation"}</div>
                      <div className="text-xs text-[var(--color-fg-muted)] truncate">{c.lastMessage || "Open conversation"}</div>
                    </div>
                  </div>
                </button>
              ))
            ) : !err ? (
              <div className="p-8 text-center">
                <MessageCircle size={28} className="text-[var(--color-fg-subtle)] mx-auto mb-3" />
                <p className="text-sm text-[var(--color-fg-muted)]">No conversations yet</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Message thread */}
        <div className="flex flex-col bg-[var(--color-bg-sunken)]" style={{ minHeight: 560 }}>
          {active ? (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-[var(--color-surface-1)] border-b border-[var(--color-border)]">
                <button
                  onClick={() => setActive(undefined)}
                  className="sm:hidden flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[var(--color-surface-3)] transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-[800] text-sm">
                  {(active.title || "C")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-[800] text-sm truncate">{active.title || "Property conversation"}</div>
                  <div className="text-xs text-[var(--color-fg-muted)]">
                    Property: {active.propertyId || "—"}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {(active.messages || []).map((m: any) => {
                  const isMe = m.senderId === active.userId;
                  return (
                    <div key={m.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                      <span className={`
                        flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-[800]
                        ${isMe ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]" : "bg-[var(--color-surface-3)] text-[var(--color-fg-muted)]"}
                      `}>
                        {isMe ? "Me" : "P"}
                      </span>
                      <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                        <div className={`
                          rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                          ${isMe
                            ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)] rounded-tr-sm"
                            : "bg-[var(--color-surface-1)] text-[var(--color-fg)] rounded-tl-sm border border-[var(--color-border)]"}
                        `}>
                          {m.body}
                          {(m.attachments || []).map((a: Attachment) => (
                            <button key={a.id}
                              className="flex items-center gap-1.5 mt-2 text-xs opacity-80 hover:opacity-100"
                              onClick={() => void openAttachment(a.id)}>
                              <Paperclip size={11} /> {a.filename} <ExternalLink size={10} />
                            </button>
                          ))}
                        </div>
                        <span className="text-[10px] text-[var(--color-fg-subtle)] px-1">
                          {new Date(m.createdAt).toLocaleTimeString("en-RW", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Attachments preview */}
              {attachments.length > 0 && (
                <div className="px-4 py-2 bg-[var(--color-surface-1)] border-t border-[var(--color-border)] flex flex-wrap gap-2">
                  {attachments.map(a => (
                    <span key={a.id} className="flex items-center gap-1.5 badge badge-gray">
                      <Paperclip size={11} /> {a.filename}
                      <button onClick={() => setAttachments(x => x.filter(x => x.id !== a.id))}>
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Compose */}
              <div className="flex items-center gap-2 p-3 bg-[var(--color-surface-1)] border-t border-[var(--color-border)]">
                <input ref={fileRef} hidden type="file" multiple onChange={e => void upload(e.target.files)} />
                <button
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl hover:bg-[var(--color-surface-3)] transition-colors text-[var(--color-fg-muted)]"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  aria-label={uploading ? "Uploading…" : "Attach file"}
                >
                  {uploading ? <span className="spinner" /> : <Paperclip size={18} />}
                </button>
                <input
                  className="field flex-1"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
                  placeholder="Write a message…"
                  style={{ minHeight: 44 }}
                />
                <button
                  className="btn flex h-10 w-10 flex-shrink-0 items-center justify-center p-0"
                  disabled={sending || (!body.trim() && !attachments.length)}
                  onClick={() => void send()}
                  aria-label={sending ? "Sending…" : "Send message"}
                >
                  {sending ? <span className="spinner" style={{ borderTopColor: "#fff" }} /> : <Send size={16} />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="text-center">
                <MessageCircle size={40} className="text-[var(--color-fg-subtle)] mx-auto mb-4" />
                <h3 className="font-[800] text-lg mb-2">Select a conversation</h3>
                <p className="text-sm text-[var(--color-fg-muted)] max-w-xs">
                  Choose a conversation to load its message history and start replying.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
