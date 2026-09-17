import { Link } from "react-router";
import { useChat } from "../hooks/useChat";

export default function ChatRoomHeader() {
  const { conversation, connected, pending, finishSession } = useChat();
  const participants = conversation?.participants ?? [];
  return (
    <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/invite" className="btn btn-ghost btn-circle btn-sm" aria-label="Retour aux invitations" title="Kembali ke undangan">←</Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-warning badge-xs font-bold text-[10px]">Lesson {conversation?.lesson_id}</span>
              <span className="text-xs font-bold text-slate-500">Sesi {conversation?.id}</span>
            </div>
            <h1 className="font-display font-bold text-base sm:text-lg leading-tight">{conversation?.lesson_title || "Latihan Percakapan"}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
            <div className="flex -space-x-2">
              {participants.map((person) => <div key={person.user_id} title={person.username} className="avatar placeholder w-7 h-7 rounded-full bg-sky-200 border-2 border-white grid place-items-center font-bold">{person.username?.slice(0, 1).toUpperCase()}</div>)}
              <div title="Anna — AI mentor" className="w-7 h-7 rounded-full bg-amber-200 border-2 border-white grid place-items-center">A</div>
            </div>
            <span className="font-bold text-slate-600">{participants.length} peserta + Anna</span>
          </div>
          <button type="button" onClick={finishSession} disabled={!connected || Boolean(pending) || conversation?.status !== "active"} className="btn btn-sm bg-rose-500 hover:bg-rose-600 text-white font-display border-b-2 border-rose-700 rounded-xl px-3 sm:px-4 text-xs transition-colors duration-200">
            <span className="hidden sm:inline">Selesai Sesi (Anna finish)</span><span className="sm:hidden">Selesai</span>
          </button>
        </div>
      </div>
    </header>
  );
}
