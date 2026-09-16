import { useChat } from "../hooks/useChat";
import { useAuth } from "../hooks/useAuth";
import { sameId } from "../utils/chatState";

export default function ChatMessage({ message }) {
  const { user } = useAuth();
  const { conversation, setDraft, connected, pending } = useChat();
  const mine = message.sender_type === "user" && sameId(message.sender_id, user?.id);
  const sender = conversation?.participants?.find((person) => sameId(person.user_id, message.sender_id));
  const name = message.sender_type === "ai" ? "Anna (AI)" : mine ? user?.username : sender?.username;
  const date = new Date(message.created_at);
  const time = Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  if (message.message_type === "suggestion") {
    return (
      <article className="my-4 max-w-lg mx-auto bg-gradient-to-r from-amber-100 via-orange-50 to-amber-100 border-2 border-amber-300 rounded-3xl p-4 shadow-sm">
        <h3 className="font-display font-bold text-xs text-amber-900 uppercase tracking-wider mb-2">Saran Jawaban dari Anna (AI)</h3>
        <p className="text-xs text-slate-600 mb-2">Kamu bisa pakai atau sesuaikan kalimat rekomendasi berikut:</p>
        <div className="bg-white/90 rounded-2xl p-3 border border-amber-200 text-sm font-semibold">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          <button type="button" onClick={() => setDraft(message.content)} disabled={!connected || Boolean(pending) || conversation?.status !== "active"} className="btn btn-xs bg-amber-400 text-slate-900 border-none rounded-lg font-bold mt-3 transition-colors duration-200">Pakai</button>
        </div>
      </article>
    );
  }

  return (
    <article className={`chat ${mine ? "chat-end" : "chat-start"}`}>
      <div className="chat-image avatar">
        <div className={`w-10 h-10 rounded-2xl font-display font-bold shadow-sm ${mine ? "bg-amber-400 text-slate-900" : "bg-sky-400 text-white"}`}>
          <span className="flex h-full items-center justify-center">{(name || "?").slice(0, 1).toUpperCase()}</span>
        </div>
      </div>
      <div className="chat-header text-xs text-slate-500 font-bold mb-1">{name || "Peserta"} {mine && "• Kamu"} <time className="font-mono text-[10px]">{time}</time></div>
      <div className={`chat-bubble rounded-2xl shadow-sm text-sm font-medium py-2.5 px-4 leading-relaxed whitespace-pre-wrap break-words ${mine ? "bg-emerald-500 text-white border-b-2 border-emerald-700" : "bg-white text-slate-800 border-2 border-slate-200"}`}>{message.content}</div>
      {mine && <div className="chat-footer text-[10px] text-slate-500 mt-1">Terkirim ✓</div>}
    </article>
  );
}
