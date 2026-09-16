import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { io } from "socket.io-client";
import { ChatContext } from "./ChatContext";
import { useAuth } from "../hooks/useAuth";
import { baseUrl } from "../constant/baseUrl";
import { fetchConversation, fetchMessages } from "../services/conversationService";
import { bindChatEvents, chatReducer, initialChatState } from "../utils/chatState";

export default function ChatProvider({ children }) {
  const { token, user } = useAuth();
  // Replacing the authenticated session also clears private chat/evaluation data.
  return <SessionProvider key={`${token ?? "guest"}:${user?.id ?? ""}`} token={token} userId={user?.id}>{children}</SessionProvider>;
}

function SessionProvider({ children, token, userId }) {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const [draft, setDraft] = useState("");
  const socketRef = useRef(null);
  const busyRef = useRef(false);

  const openSession = useCallback((id) => {
    let cancelled = false;
    let socket;
    let unbind;
    dispatch({ type: "reset" });
    setDraft("");
    busyRef.current = false;
    async function load() {
      try {
        const [conversation, messages] = await Promise.all([
          fetchConversation(token, id), fetchMessages(token, id),
        ]);
        if (cancelled) return;
        if (!conversation?.id || !Array.isArray(messages)) throw new Error("Format respons percakapan tidak sesuai kontrak.");
        dispatch({ type: "loaded", conversation, messages });
        if (conversation.status === "completed") return;
        socket = io(baseUrl.replace(/\/api\/?$/, ""), {
          auth: { token: `Bearer ${token}` }, autoConnect: false,
          forceNew: true, reconnectionAttempts: 3, timeout: 10000,
        });
        socketRef.current = socket;
        unbind = bindChatEvents(socket, id, userId, dispatch);
        socket.connect();
      } catch (error) {
        if (!cancelled) dispatch({ type: "failed", message: error.response?.data?.message || error.message || "Gagal memuat percakapan." });
      }
    }
    if (token) load();
    return () => {
      cancelled = true;
      unbind?.();
      socket?.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
      busyRef.current = false;
    };
  }, [token, userId]);

  useEffect(() => {
    busyRef.current = Boolean(state.pending);
    if (!state.pending) return;
    const timer = setTimeout(() => dispatch({ type: "error", message: "Belum ada konfirmasi server. Periksa riwayat sebelum mencoba lagi; aksi tidak diulang otomatis." }), 30000);
    return () => clearTimeout(timer);
  }, [state.pending]);

  function perform(action, content) {
    const socket = socketRef.current;
    if (!socket?.connected || busyRef.current || state.conversation?.status === "completed") return false;
    if (action !== "ready" && state.conversation?.status !== "active") return false;
    if (action === "ready" && (state.ready || state.conversation?.status === "active")) return false;
    const events = { ready: "demo:ready", send: "message:send", suggestion: "suggestion:request", finish: "session:finish" };
    if (!events[action]) return false;
    busyRef.current = true;
    dispatch({ type: "pending", value: action });
    const payload = { conversationId: Number(state.conversation.id) };
    if (action === "send") payload.content = content;
    socket.emit(events[action], payload);
    return true;
  }

  function sendMessage() {
    const content = draft.trim();
    if (!content) return false;
    const command = content.toLowerCase();
    if (command === "anna finish") return perform("finish");
    if (command === "anna, minta saran jawaban") return perform("suggestion");
    return perform("send", content);
  }

  return <ChatContext.Provider value={{ ...state, draft, setDraft, openSession, sendMessage,
    markReady: () => perform("ready"), requestSuggestion: () => perform("suggestion"),
    finishSession: () => perform("finish"),
    reconnect: () => socketRef.current?.connect(),
  }}>{children}</ChatContext.Provider>;
}
