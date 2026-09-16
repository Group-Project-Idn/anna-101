import { useChat } from "../hooks/useChat";

export default function ChatComposer() {
  const { draft, setDraft, connected, pending, conversation, sendMessage, requestSuggestion, finishSession } = useChat();
  const disabled = !connected || Boolean(pending) || conversation?.status !== "active";
  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }
  return (
    <footer className="sticky bottom-3 bg-white/90 backdrop-blur-md border-2 border-slate-200 rounded-3xl p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 overflow-x-auto text-xs">
        <span className="text-slate-500 font-extrabold uppercase text-[10px] tracking-wider shrink-0">Bantuan Cepat:</span>
        <button type="button" disabled={disabled} onClick={requestSuggestion} className="btn btn-xs bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl font-bold shrink-0 transition-colors duration-200">Anna, minta saran jawaban</button>
        <button type="button" disabled={disabled} onClick={finishSession} className="btn btn-xs bg-slate-100 hover:bg-rose-50 text-slate-700 border border-slate-200 rounded-xl font-bold shrink-0 transition-colors duration-200">Anna finish (Akhiri Sesi)</button>
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <label className="sr-only" htmlFor="chat-message">Pesan dalam bahasa Inggris</label>
        <input id="chat-message" value={draft} onChange={(event) => setDraft(event.target.value)} disabled={disabled} autoComplete="off" placeholder="Ketik pesan dalam bahasa Inggris…" className="input w-full min-w-0 rounded-2xl border-2 border-slate-200 focus:border-emerald-400 text-sm font-semibold h-12" />
        <button type="submit" disabled={disabled || !draft.trim()} className="btn bg-emerald-500 hover:bg-emerald-600 text-white font-display border-b-4 border-emerald-700 rounded-2xl h-12 px-5 transition-colors duration-200">Kirim</button>
      </form>
      {conversation?.status !== "active" && <p className="text-xs text-slate-500 mt-2">{conversation?.status === "completed" ? "Sesi selesai. Riwayat hanya dapat dibaca." : "Latihan dimulai setelah server mengonfirmasi kedua peserta siap."}</p>}
    </footer>
  );
}
