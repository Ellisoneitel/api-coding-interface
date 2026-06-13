import { useEffect, useState, useCallback, useRef } from "react";

// v2 store. The API keys are a single global pool; every chat session is an
// isolated unit that owns its own settings, conversation, and turn log, plus a
// reference to which pooled key it uses.
const KEY = "codex-local-assistant.store.v2";
const OLD_KEY = "codex-local-assistant.settings.v1";

// Per-conversation settings (everything that used to be global).
const SETTING_DEFAULTS = {
  keyId: null, // which pooled API key this chat uses
  model: "gpt-5.5",
  approvalMode: "manual", // "manual" | "auto"
  allowOutsideWorkspace: false,
  safetyIdentifierEnabled: false,
  safetyIdentifier: "",
  workspaceRoot: "",
  workspaceValidated: false,
};

const SETTING_KEYS = Object.keys(SETTING_DEFAULTS);

function makeChat(seed = {}) {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    createdAt: now,
    updatedAt: now,
    previousResponseId: null,
    messages: [],
    turns: [],
    ...SETTING_DEFAULTS,
    // only copy known setting fields from the seed
    ...Object.fromEntries(SETTING_KEYS.filter((k) => k in seed).map((k) => [k, seed[k]])),
  };
}

function freshStore() {
  const chat = makeChat();
  return { version: 2, apiKeys: [], chats: [chat], activeChatId: chat.id, defaults: { ...SETTING_DEFAULTS } };
}

// Wrap an existing v1 settings blob into the v2 shape: keep the key pool, fold
// the old global settings into one starter chat + the defaults for new chats.
function migrateV1(old) {
  const apiKeys = Array.isArray(old.apiKeys) ? old.apiKeys : [];
  const seed = {
    keyId: old.activeKeyId || apiKeys[0]?.id || null,
    model: old.model ?? SETTING_DEFAULTS.model,
    approvalMode: old.approvalMode ?? SETTING_DEFAULTS.approvalMode,
    allowOutsideWorkspace: old.allowOutsideWorkspace ?? false,
    safetyIdentifierEnabled: old.safetyIdentifierEnabled ?? false,
    safetyIdentifier: old.safetyIdentifier ?? "",
    workspaceRoot: old.workspaceRoot ?? "",
    workspaceValidated: old.workspaceValidated ?? false,
  };
  const chat = makeChat(seed);
  return { version: 2, apiKeys, chats: [chat], activeChatId: chat.id, defaults: { ...seed } };
}

function normalize(store) {
  if (!Array.isArray(store.apiKeys)) store.apiKeys = [];
  if (!store.defaults) store.defaults = { ...SETTING_DEFAULTS };
  if (!Array.isArray(store.chats) || store.chats.length === 0) {
    const chat = makeChat(store.defaults);
    store.chats = [chat];
    store.activeChatId = chat.id;
  }
  if (!store.chats.find((c) => c.id === store.activeChatId)) {
    store.activeChatId = store.chats[0].id;
  }
  store.version = 2;
  return store;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch {
    /* fall through */
  }
  try {
    const old = JSON.parse(localStorage.getItem(OLD_KEY) || "null");
    if (old) return normalize(migrateV1(old));
  } catch {
    /* fall through */
  }
  return freshStore();
}

export function useStore() {
  const [store, setStore] = useState(load);

  // Debounced persistence so rapid streaming updates don't thrash localStorage.
  const timer = useRef(null);
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(store));
      } catch {
        /* quota exceeded — keep running with in-memory state */
      }
    }, 200);
    return () => clearTimeout(timer.current);
  }, [store]);

  // ── API key pool ──────────────────────────────────────────────────────────
  const addKey = useCallback((label, key) => {
    setStore((s) => {
      const id = crypto.randomUUID();
      const apiKeys = [...s.apiKeys, { id, label: label || `Key ${s.apiKeys.length + 1}`, key }];
      // If the active chat has no key yet, adopt the one just added.
      const chats = s.chats.map((c) =>
        c.id === s.activeChatId && !c.keyId ? { ...c, keyId: id } : c
      );
      return { ...s, apiKeys, chats };
    });
  }, []);

  const removeKey = useCallback((id) => {
    setStore((s) => {
      const apiKeys = s.apiKeys.filter((k) => k.id !== id);
      // Detach the removed key from any chat that referenced it.
      const chats = s.chats.map((c) => (c.keyId === id ? { ...c, keyId: null } : c));
      return { ...s, apiKeys, chats };
    });
  }, []);

  // ── Chats ─────────────────────────────────────────────────────────────────
  const newChat = useCallback(() => {
    setStore((s) => {
      const src = s.chats.find((c) => c.id === s.activeChatId) || s.defaults;
      // Inherit the current chat's settings (key, workspace, model, …) so a new
      // session starts where you left off; you can change the key in the sidebar.
      const seed = { ...Object.fromEntries(SETTING_KEYS.map((k) => [k, src[k]])) };
      if (!seed.keyId) seed.keyId = s.apiKeys[0]?.id || null;
      const chat = makeChat(seed);
      return { ...s, chats: [chat, ...s.chats], activeChatId: chat.id };
    });
  }, []);

  const switchChat = useCallback((id) => {
    setStore((s) => (s.activeChatId === id ? s : { ...s, activeChatId: id }));
  }, []);

  const renameChat = useCallback((id, title) => {
    setStore((s) => ({
      ...s,
      chats: s.chats.map((c) =>
        c.id === id ? { ...c, title: title.trim() || "Untitled", updatedAt: Date.now() } : c
      ),
    }));
  }, []);

  const deleteChat = useCallback((id) => {
    setStore((s) => {
      let chats = s.chats.filter((c) => c.id !== id);
      let activeChatId = s.activeChatId;
      if (chats.length === 0) {
        const chat = makeChat({ ...s.defaults, keyId: s.apiKeys[0]?.id || null });
        chats = [chat];
        activeChatId = chat.id;
      } else if (id === s.activeChatId) {
        activeChatId = chats[0].id;
      }
      return { ...s, chats, activeChatId };
    });
  }, []);

  // Patch a chat. `patch` may be an object or a (chat) => partial function.
  // When it touches setting fields, mirror them into `defaults` so future new
  // chats inherit the latest values.
  const updateChat = useCallback((id, patch) => {
    setStore((s) => {
      let nextDefaults = s.defaults;
      const chats = s.chats.map((c) => {
        if (c.id !== id) return c;
        const p = typeof patch === "function" ? patch(c) : patch;
        const touchedSettings = Object.keys(p).some((k) => SETTING_KEYS.includes(k));
        if (touchedSettings) {
          nextDefaults = { ...s.defaults };
          for (const k of SETTING_KEYS) if (k in p) nextDefaults[k] = p[k];
        }
        return { ...c, ...p, updatedAt: Date.now() };
      });
      return { ...s, chats, defaults: nextDefaults };
    });
  }, []);

  const activeChat = store.chats.find((c) => c.id === store.activeChatId) || null;
  const activeKey = store.apiKeys.find((k) => k.id === activeChat?.keyId) || null;

  const updateActive = useCallback(
    (patch) => updateChat(store.activeChatId, patch),
    [store.activeChatId, updateChat]
  );

  return {
    apiKeys: store.apiKeys,
    addKey,
    removeKey,
    chats: store.chats,
    activeChat,
    activeChatId: store.activeChatId,
    activeKey,
    newChat,
    switchChat,
    renameChat,
    deleteChat,
    updateChat,
    updateActive,
  };
}
