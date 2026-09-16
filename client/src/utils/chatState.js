export const initialChatState = {
  conversation: null, messages: [], lines: [], evaluation: null,
  status: "loading", connected: false, ready: false, pending: null, error: "",
};

export function sameId(a, b) {
  return a != null && b != null && String(a) === String(b);
}

export function chatReducer(state, action) {
  switch (action.type) {
    case "reset":
      return { ...initialChatState };
    case "loaded":
      return { ...state, conversation: action.conversation, messages: action.messages, status: "success", error: "" };
    case "failed":
      return { ...state, status: "error", error: action.message };
    case "connection":
      return { ...state, connected: action.connected, pending: null, error: action.message || "" };
    case "pending":
      return { ...state, pending: action.value, error: "", ready: action.value === "ready" || state.ready };
    case "error":
      return { ...state, error: action.message, pending: null, ready: state.pending === "ready" ? false : state.ready };
    case "demo":
      return state.conversation?.status === "completed" || state.conversation?.status === "active"
        ? state : { ...state, lines: action.lines };
    case "active":
      return { ...state, lines: [], pending: null, conversation: { ...state.conversation, status: "active" } };
    case "message": {
      const messages = [...state.messages];
      const index = messages.findIndex((item) => sameId(item.id, action.message.id));
      if (index < 0) messages.push(action.message);
      else messages[index] = action.message;
      const resolved = (state.pending === "suggestion" && action.message.message_type === "suggestion") ||
        (state.pending === "send" && action.message.sender_type === "user" && sameId(action.message.sender_id, action.userId));
      return { ...state, messages, pending: resolved ? null : state.pending };
    }
    case "evaluation":
      return { ...state, evaluation: action.data, lines: [], pending: null, conversation: { ...state.conversation, status: "completed" } };
    default:
      return state;
  }
}

// A dedicated socket joins one conversation only. Some contracted events omit room ID.
export function bindChatEvents(socket, conversationId, userId, dispatch) {
  const belongs = (data) => {
    const id = data?.conversationId ?? data?.conversation_id;
    return id == null || sameId(id, conversationId);
  };
  const handlers = {
    connect: () => {
      dispatch({ type: "connection", connected: true });
      socket.emit("conversation:join", { conversationId: Number(conversationId) });
    },
    disconnect: () => dispatch({ type: "connection", connected: false, message: "Koneksi terputus. Pesan yang belum dikonfirmasi tidak dikirim ulang otomatis." }),
    connect_error: () => dispatch({ type: "connection", connected: false, message: "Chat realtime belum terhubung. Periksa koneksi dan autentikasi server." }),
    error: (data) => { if (belongs(data)) dispatch({ type: "error", message: data?.message || "Aksi chat gagal. Silakan coba lagi." }); },
    "demo:script": (data) => {
      if (belongs(data) && Array.isArray(data?.lines)) dispatch({ type: "demo", lines: data.lines });
    },
    "conversation:active": (data) => { if (belongs(data)) dispatch({ type: "active" }); },
    "message:new": (message) => {
      if (belongs(message) && message?.id != null && typeof message.content === "string") dispatch({ type: "message", message, userId });
    },
    "session:evaluation": (data) => {
      if (sameId(data?.conversationId, conversationId) && sameId(data?.user_id, userId)) dispatch({ type: "evaluation", data });
    },
  };
  Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));
  return () => Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
}
