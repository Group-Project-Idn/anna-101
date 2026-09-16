import { useState } from "react";
import { useNavigate } from "react-router";
import { useInvites } from "../hooks/useInvites";
import { showErrorToast, showSuccessToast } from "../utils/toast";

function InviteItemActions({ invite }) {
  const { respondInvite } = useInvites();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function handleRespond(action) {
    if (busy) {
      return;
    }

    setBusy(true);

    const result = await respondInvite(invite.id, action);

    setBusy(false);

    if (!result.ok) {
      showErrorToast(result.message);
      return;
    }

    // Via socket: server broadcast invite:status yang mengupdate list.
    // Via REST fallback: list sudah diupdate provider, langsung navigasi.
    if (action === "accept") {
      if (result.via === "rest" && result.data?.conversation_id) {
        showSuccessToast("Undangan diterima. Masuk ke room...");
        navigate(`/chat-room/${result.data.conversation_id}`);
      } else {
        showSuccessToast("Respons terkirim. Menunggu room...");
      }
    } else {
      showSuccessToast("Undangan ditolak.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => handleRespond("accept")}
        className="btn btn-xs bg-emerald-500 hover:bg-emerald-600 text-white font-display border-b-2 border-emerald-700 active:border-b-0 rounded-xl shadow-sm disabled:opacity-60"
      >
        {busy ? "…" : "Terima ✅"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => handleRespond("reject")}
        className="btn btn-xs bg-white hover:bg-slate-100 text-slate-600 border-2 border-slate-200 rounded-xl font-bold disabled:opacity-60"
      >
        {busy ? "…" : "Tolak"}
      </button>
    </div>
  );
}

export default function InviteItem({ invite, variant }) {
  const navigate = useNavigate();
  const isIncoming = variant === "incoming";
  const isPending = invite.status === "pending";
  const peer = isIncoming ? invite.from_username : invite.to_username;
  const initial = peer?.charAt(0)?.toUpperCase() ?? "?";
  const lesson = invite.lesson_title ?? `Lesson #${invite.lesson_id ?? "-"}`;
  const level = invite.pathway_level ? ` • Level ${invite.pathway_level}` : "";

  if (!isPending) {
    const accepted = invite.status === "accepted";
    return (
      <div className="mt-3 flex flex-wrap items-center gap-3 bg-white border-2 border-slate-100 rounded-2xl p-3 opacity-70">
        <div className="w-10 h-10 rounded-2xl bg-slate-300 text-white flex items-center justify-center font-display font-bold">
          {initial}
        </div>
        <div className="flex-1 min-w-[140px]">
          <p className="text-sm font-bold text-slate-700">
            {isIncoming ? `@${peer} pernah mengundangmu` : `Untuk @${peer}`}
          </p>
          <p className="text-[11px] font-semibold text-slate-400">
            {lesson} • sudah kamu {accepted ? "terima" : "tolak"}
          </p>
        </div>
        <span
          className={
            accepted
              ? "badge bg-emerald-100 text-emerald-700 border-none text-[10px] font-bold"
              : "badge bg-slate-200 text-slate-500 border-none text-[10px] font-bold"
          }
        >
          {accepted ? "✅ Diterima" : "Ditolak"}
        </span>
        {isIncoming && accepted && invite.conversation_id ? (
          <button
            type="button"
            onClick={() => navigate(`/chat-room/${invite.conversation_id}`)}
            className="btn btn-xs bg-emerald-500 hover:bg-emerald-600 text-white font-display border-b-2 border-emerald-700 active:border-b-0 rounded-xl shadow-sm"
          >
            Masuk Room
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 bg-slate-50 border-2 border-slate-200 rounded-2xl p-3">
      <div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-display font-bold shadow-sm ${
          isIncoming ? "bg-sky-400 text-white" : "bg-amber-400 text-slate-900"
        }`}
      >
        {initial}
      </div>
      <div className="flex-1 min-w-[140px]">
        <p className="text-sm font-bold text-slate-700">
          {isIncoming ? `@${peer} mengundangmu` : `Untuk @${peer}`}
        </p>
        <p className="text-[11px] font-semibold text-slate-400">
          {lesson}
          {level}
          {isIncoming ? "" : " • menunggu jawaban"}
        </p>
      </div>
      {isIncoming ? (
        <InviteItemActions invite={invite} />
      ) : (
        <span className="badge bg-amber-100 text-amber-800 border-none text-[10px] font-bold">
          ⏳ Pending
        </span>
      )}
    </div>
  );
}
