import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InviteContext } from "./InviteContext";
import { fetchInvites as fetchInvitesRequest } from "../services/inviteService";
import { disconnectInviteSocket, getInviteSocket } from "../services/socket";

function sortNewestFirst(list) {
  return [...list].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });
}

function upsertInvite(list, invite) {
  const exists = list.some((item) => item.id === invite.id);
  const next = exists
    ? list.map((item) => (item.id === invite.id ? { ...item, ...invite } : item))
    : [invite, ...list];
  return sortNewestFirst(next);
}

// Normalisasi payload socket (invite:new) ke bentuk item list REST.
function normalizeNewInvite(payload) {
  return {
    id: payload.id,
    lesson_id: payload.lesson_id,
    lesson_title: payload.lesson_title,
    pathway_id: payload.pathway_id,
    pathway_level: payload.pathway_level,
    from_user_id: payload.from_user_id,
    from_username: payload.from_username,
    to_user_id: payload.to_user_id,
    to_username: payload.to_username,
    status: "pending",
    created_at: payload.created_at ?? new Date().toISOString(),
  };
}

export default function InviteProvider({ children }) {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [socketReady, setSocketReady] = useState(false);
  const userRef = useRef(null);
  const requestRef = useRef(false);
  const socketRef = useRef(null);

  const fetchInvites = useCallback(async (token, options) => {
    if (requestRef.current) {
      return { ok: true };
    }
    requestRef.current = true;
    setStatus("loading");
    setError(null);

    try {
      const data = await fetchInvitesRequest(token, options);
      setIncoming(sortNewestFirst(data.incoming));
      setOutgoing(sortNewestFirst(data.outgoing));
      setStatus("success");
      return { ok: true };
    } catch (err) {
      requestRef.current = false;
      const message =
        err.response?.data?.message ||
        "Gagal memuat undangan. Pastikan server aktif lalu coba lagi.";
      setError(message);
      setStatus("error");
      return { ok: false, message };
    }
  }, []);

  // Socket lifecycle: connect sekali per user, dengarkan invite:new &
  // invite:status, disconnect saat unmount. REST dipakai untuk load awal.
  const connectSocket = useCallback((token, user) => {
    userRef.current = user ?? null;

    if (socketRef.current) {
      return socketRef.current;
    }

    const socket = getInviteSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketReady(true);
      socket.emit("invite:join", { userId: user?.id });
    });

    socket.on("disconnect", () => {
      setSocketReady(false);
    });

    // Undangan baru masuk — prepend ke sisi yang sesuai + badge pending +1.
    socket.on("invite:new", (payload) => {
      const invite = normalizeNewInvite(payload);
      const me = userRef.current;

      if (me && (invite.to_user_id === me.id || invite.to_username === me.username)) {
        setIncoming((prev) => upsertInvite(prev, invite));
      } else if (
        me &&
        (invite.from_user_id === me.id || invite.from_username === me.username)
      ) {
        setOutgoing((prev) => upsertInvite(prev, invite));
      } else if (!me) {
        // Tanpa info user (mis. token basi), tampilkan di kedua sisi
        // berdasarkan kecocokan seadanya — halaman tetap realtime.
        setIncoming((prev) => upsertInvite(prev, invite));
        setOutgoing((prev) => upsertInvite(prev, invite));
      }
    });

    // Perubahan status (diterima/ditolak) — update item di KEDUA sisi.
    socket.on("invite:status", (payload) => {
      const patch = {
        id: payload.invite_id,
        status: payload.status,
        ...(payload.conversation_id
          ? { conversation_id: payload.conversation_id }
          : {}),
      };

      setIncoming((prev) => upsertInvite(prev, patch));
      setOutgoing((prev) => upsertInvite(prev, patch));
    });

    return socket;
  }, []);

  const sendInvite = useCallback(
    (payload) => {
      const socket = socketRef.current;

      if (socket?.connected) {
        socket.emit("invite:send", payload);
        return { ok: true, via: "socket" };
      }

      return { ok: false, via: "socket", message: "Socket belum terhubung." };
    },
    [],
  );

  const respondInvite = useCallback((inviteId, action) => {
    const socket = socketRef.current;

    if (socket?.connected) {
      socket.emit("invite:respond", { inviteId, action });
      return { ok: true, via: "socket" };
    }

    return { ok: false, via: "socket", message: "Socket belum terhubung." };
  }, []);

  useEffect(
    () => () => {
      if (socketRef.current) {
        socketRef.current.off("invite:new");
        socketRef.current.off("invite:status");
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        disconnectInviteSocket();
        socketRef.current = null;
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      incoming,
      outgoing,
      status,
      error,
      socketReady,
      fetchInvites,
      connectSocket,
      sendInvite,
      respondInvite,
    }),
    [
      incoming,
      outgoing,
      status,
      error,
      socketReady,
      fetchInvites,
      connectSocket,
      sendInvite,
      respondInvite,
    ],
  );

  return <InviteContext.Provider value={value}>{children}</InviteContext.Provider>;
}
