import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InviteContext } from "./InviteContext";
import {
  acceptInviteRest,
  fetchInvites as fetchInvitesRequest,
  rejectInviteRest,
} from "../services/inviteService";
import { disconnectInviteSocket, getInviteSocket } from "../services/socket";
import { showErrorToast } from "../utils/toast";

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
  const [socketError, setSocketError] = useState(null);
  const userRef = useRef(null);
  const tokenRef = useRef(null);
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

  // Socket lifecycle: connect sekali per user, dengarkan invite:new,
  // invite:status, dan error global. REST dipakai untuk load awal + fallback.
  const connectSocket = useCallback((token, user) => {
    userRef.current = user ?? null;
    tokenRef.current = token ?? null;

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

    // Error global dari server (kontrak: socket.on("error", { message })).
    // Tampilkan toast + simpan state supaya halaman bisa fallback ke REST.
    socket.on("error", (payload) => {
      const message = payload?.message || "Koneksi realtime bermasalah.";
      setSocketError(message);
      setSocketReady(false);
      showErrorToast(message);
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

  const respondInvite = useCallback(async (inviteId, action) => {
    const socket = socketRef.current;

    if (socket?.connected) {
      socket.emit("invite:respond", { inviteId, action });
      return { ok: true, via: "socket" };
    }

    // Fallback REST bila socket belum terhubung — response accept membawa
    // conversation_id sehingga tombol "Masuk Room" tetap bisa muncul.
    const token = tokenRef.current;

    if (!token) {
      return { ok: false, via: "rest", message: "Sesi berakhir. Masuk lagi." };
    }

    try {
      const data =
        action === "accept"
          ? await acceptInviteRest(token, inviteId)
          : await rejectInviteRest(token, inviteId);

      const patch = {
        id: inviteId,
        status:
          data.status ?? (action === "accept" ? "accepted" : "rejected"),
        ...(data.conversation_id
          ? { conversation_id: data.conversation_id }
          : {}),
      };

      setIncoming((prev) => upsertInvite(prev, patch));
      setOutgoing((prev) => upsertInvite(prev, patch));

      return { ok: true, via: "rest", data };
    } catch (err) {
      const message =
        err.response?.data?.message || "Gagal merespons undangan. Coba lagi.";
      return { ok: false, via: "rest", message };
    }
  }, []);

  useEffect(
    () => () => {
      if (socketRef.current) {
        socketRef.current.off("invite:new");
        socketRef.current.off("invite:status");
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("error");
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
      socketError,
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
      socketError,
      fetchInvites,
      connectSocket,
      sendInvite,
      respondInvite,
    ],
  );

  return <InviteContext.Provider value={value}>{children}</InviteContext.Provider>;
}
