import { useState } from "react";
import {
  KeyRound,
  Plus,
  Trash2,
  ShieldCheck,
  FolderOpen,
  FolderSearch,
  Globe,
  Check,
  AlertTriangle,
  Zap,
  Hand,
  RefreshCw,
  MessageSquare,
  MessageSquarePlus,
  Pencil,
} from "lucide-react";
import { validateWorkspace, browseFolder } from "../lib/agentClient";

function Section({ title, icon: Icon, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <Icon size={13} /> {title}
      </div>
      {children}
    </div>
  );
}

function relTime(ts) {
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function Sidebar({
  width,
  chats,
  activeChatId,
  onNewChat,
  onSwitchChat,
  onRenameChat,
  onDeleteChat,
  settings,
  update,
  apiKeys,
  addKey,
  removeKey,
  activeKey,
}) {
  const [label, setLabel] = useState("");
  const [keyVal, setKeyVal] = useState("");
  const [wsStatus, setWsStatus] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState("");

  const onAdd = () => {
    if (!keyVal.trim()) return;
    addKey(label.trim(), keyVal.trim());
    setLabel("");
    setKeyVal("");
  };

  const startRename = (chat) => {
    setEditingId(chat.id);
    setEditVal(chat.title);
  };
  const commitRename = () => {
    if (editingId) onRenameChat(editingId, editVal);
    setEditingId(null);
    setEditVal("");
  };

  // Generate a stable, hashed-looking safety identifier (SHA-256 hex).
  const generateSafetyId = async () => {
    const seed = `${crypto.randomUUID()}-${Date.now()}`;
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed));
    return Array.from(new Uint8Array(bytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const toggleSafetyId = async () => {
    const next = !settings.safetyIdentifierEnabled;
    if (next && !settings.safetyIdentifier?.trim()) {
      update({ safetyIdentifierEnabled: true, safetyIdentifier: await generateSafetyId() });
    } else {
      update({ safetyIdentifierEnabled: next });
    }
  };

  const regenerateSafetyId = async () => {
    update({ safetyIdentifier: await generateSafetyId() });
  };

  const checkWorkspace = async () => {
    setWsStatus({ checking: true });
    const r = await validateWorkspace(settings.workspaceRoot);
    setWsStatus(r);
    update({ workspaceValidated: !!r.ok });
  };

  const openFolderPicker = async () => {
    setWsStatus({ checking: true });
    const r = await browseFolder();
    if (r.path) {
      // A path returned by the OS dialog is guaranteed to exist.
      update({ workspaceRoot: r.path, workspaceValidated: true });
      setWsStatus({ ok: true });
    } else if (r.canceled) {
      setWsStatus(null);
    } else {
      setWsStatus({ ok: false, error: r.error || "Could not open the folder picker." });
    }
  };

  const sortedChats = [...chats].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  return (
    <aside
      style={{ width }}
      className="shrink-0 border-r border-white/10 bg-[#0c0c0e] overflow-y-auto p-4 space-y-5"
    >
      <div className="flex items-center gap-2">
        <div className="grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <div className="font-semibold leading-tight">Codex Local</div>
          <div className="text-xs text-zinc-500 leading-tight">Agentic coding assistant</div>
        </div>
      </div>

      {/* CHATS */}
      <div className="space-y-2">
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
        >
          <MessageSquarePlus size={15} /> New chat
        </button>

        <div className="max-h-64 space-y-1 overflow-y-auto pr-0.5">
          {sortedChats.map((c) => {
            const active = c.id === activeChatId;
            return (
              <div
                key={c.id}
                className={`group flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
                  active
                    ? "border-sky-500/60 bg-sky-500/10"
                    : "border-transparent hover:border-white/10 hover:bg-white/5"
                }`}
              >
                <MessageSquare size={14} className="shrink-0 text-zinc-500" />
                {editingId === c.id ? (
                  <input
                    autoFocus
                    value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setEditVal("");
                      }
                    }}
                    className="min-w-0 flex-1 rounded border border-white/10 bg-black/40 px-1.5 py-0.5 text-sm outline-none focus:border-sky-500/60"
                  />
                ) : (
                  <button
                    onClick={() => onSwitchChat(c.id)}
                    onDoubleClick={() => startRename(c)}
                    className="min-w-0 flex-1 text-left"
                    title={c.title}
                  >
                    <div className="truncate text-sm text-zinc-200">{c.title}</div>
                    <div className="text-[10px] text-zinc-500">{relTime(c.updatedAt)}</div>
                  </button>
                )}
                {editingId !== c.id && (
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => startRename(c)}
                      title="Rename chat"
                      className="text-zinc-500 hover:text-zinc-200"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => onDeleteChat(c.id)}
                      title="Delete chat"
                      className="text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SESSION SETTINGS divider — everything below applies to the active chat */}
      <div className="space-y-1 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Session settings
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <p className="text-[11px] text-zinc-600">
          These apply to the current chat only. New chats inherit them.
        </p>
      </div>

      {/* API KEY (per-chat selection from the shared pool) */}
      <Section title="API Key" icon={KeyRound}>
        <div className="space-y-1.5">
          {apiKeys.length === 0 && (
            <p className="text-xs text-zinc-500">No keys yet. Add one below.</p>
          )}
          {apiKeys.map((k) => (
            <label
              key={k.id}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 cursor-pointer ${
                settings.keyId === k.id
                  ? "border-sky-500/60 bg-sky-500/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="chatKey"
                className="accent-sky-500"
                checked={settings.keyId === k.id}
                onChange={() => update({ keyId: k.id })}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{k.label}</div>
                <div className="truncate text-[11px] text-zinc-500 font-mono">
                  {k.key.slice(0, 7)}…{k.key.slice(-4)}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  removeKey(k.id);
                }}
                className="text-zinc-500 hover:text-rose-400"
                title="Remove key from your pool"
              >
                <Trash2 size={14} />
              </button>
            </label>
          ))}
        </div>

        <div className="space-y-1.5 pt-1">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. Personal)"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-sm outline-none focus:border-sky-500/60"
          />
          <input
            value={keyVal}
            onChange={(e) => setKeyVal(e.target.value)}
            placeholder="sk-..."
            type="password"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-sm font-mono outline-none focus:border-sky-500/60"
          />
          <button
            onClick={onAdd}
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-sm"
          >
            <Plus size={14} /> Add key
          </button>
        </div>
      </Section>

      {/* MODEL */}
      <Section title="Model" icon={Zap}>
        <input
          value={settings.model}
          onChange={(e) => update({ model: e.target.value })}
          placeholder="gpt-5.5"
          className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-sm font-mono outline-none focus:border-sky-500/60"
        />
      </Section>

      {/* SAFETY IDENTIFIER */}
      <Section title="Safety Identifier" icon={ShieldCheck}>
        <label className="flex items-center justify-between rounded-lg border border-white/10 px-2.5 py-2">
          <span className="text-sm">Send per turn</span>
          <button
            onClick={toggleSafetyId}
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              settings.safetyIdentifierEnabled ? "bg-sky-500" : "bg-zinc-700"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                settings.safetyIdentifierEnabled ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </label>
        <div className="flex gap-1.5">
          <input
            value={settings.safetyIdentifier}
            onChange={(e) => update({ safetyIdentifier: e.target.value })}
            disabled={!settings.safetyIdentifierEnabled}
            placeholder="auto-generated when enabled"
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs font-mono outline-none focus:border-sky-500/60 disabled:opacity-40"
          />
          <button
            onClick={regenerateSafetyId}
            title="Generate a new safety identifier"
            className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs hover:bg-white/5"
          >
            <RefreshCw size={12} /> Generate
          </button>
        </div>
        <p className="text-[11px] text-zinc-500">
          When on, sent as <code>safety_identifier</code> on every request this turn.
        </p>
      </Section>

      {/* WORKSPACE */}
      <Section title="Workspace Folder" icon={FolderOpen}>
        <div className="flex gap-1.5">
          <input
            value={settings.workspaceRoot}
            onChange={(e) => {
              update({ workspaceRoot: e.target.value, workspaceValidated: false });
              setWsStatus(null);
            }}
            placeholder="Path to your project folder…"
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-sm font-mono outline-none focus:border-sky-500/60"
          />
          <button
            onClick={openFolderPicker}
            title="Browse for a folder"
            className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-sm hover:bg-white/5"
          >
            <FolderSearch size={14} /> Browse
          </button>
        </div>
        <button onClick={checkWorkspace} className="text-xs text-sky-400 hover:underline">
          Validate folder
        </button>
        {wsStatus?.checking && <div className="text-xs text-zinc-500">Checking…</div>}
        {wsStatus && !wsStatus.checking && (
          <div
            className={`flex items-center gap-1.5 text-xs ${
              wsStatus.ok ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {wsStatus.ok ? <Check size={13} /> : <AlertTriangle size={13} />}
            {wsStatus.ok ? "Folder is valid" : wsStatus.error}
          </div>
        )}
        {!settings.workspaceValidated && (
          <p className="text-[11px] text-amber-400/80">
            Validate the folder before you can start chatting.
          </p>
        )}
        <p className="text-[11px] text-zinc-500">
          The assistant reads, writes, and runs commands inside this folder.
        </p>
      </Section>

      {/* OUTSIDE WORKSPACE ACCESS */}
      <Section title="Outside Workspace" icon={Globe}>
        <label className="flex items-center justify-between rounded-lg border border-white/10 px-2.5 py-2">
          <span className="text-sm">Allow access outside</span>
          <button
            onClick={() => update({ allowOutsideWorkspace: !settings.allowOutsideWorkspace })}
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              settings.allowOutsideWorkspace ? "bg-sky-500" : "bg-zinc-700"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                settings.allowOutsideWorkspace ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </label>
        <p className="text-[11px] text-zinc-500">
          {settings.allowOutsideWorkspace
            ? "The agent may read, write, and run commands outside the workspace — but every outside action needs your approval, even in Auto-run."
            : "The agent is confined to the workspace folder. Reads, writes, and commands that reach outside are blocked."}
        </p>
      </Section>

      {/* APPROVAL MODE */}
      <Section title="Command Approval" icon={Hand}>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: "manual", label: "Ask first", icon: Hand },
            { id: "auto", label: "Auto-run", icon: Zap },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => update({ approvalMode: m.id })}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-sm ${
                settings.approvalMode === m.id
                  ? "border-sky-500/60 bg-sky-500/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <m.icon size={14} /> {m.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-zinc-500">
          {settings.approvalMode === "manual"
            ? "File edits run automatically; you approve each command."
            : "Commands run without prompting. Use with care."}
        </p>
      </Section>

      {!activeKey && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          Add a key and select it for this chat to start.
        </div>
      )}
    </aside>
  );
}
