import { useChat } from "../hooks/useChat";

export default function ChatDemo() {
  const { lines, ready, pending, connected, markReady } = useChat();
  return (
    <section className="bg-gradient-to-r from-amber-50 via-sky-50 to-emerald-50 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-amber-200/70">
        <h2 className="badge bg-amber-400 text-slate-900 border-none font-extrabold text-xs">PANDUAN DEMO ANNA (AI)</h2>
        <span className="text-xs font-bold text-amber-800">Demo sementara sebelum latihan mandiri</span>
      </div>
      <div className="space-y-2.5 text-sm my-3 bg-white/70 p-4 rounded-2xl border border-amber-200">
        {lines.length ? lines.map((line, index) => (
          <div key={index} className="flex flex-col sm:flex-row items-start gap-2">
            <span className="badge badge-warning badge-sm shrink-0">Speaker {line.speaker}</span>
            <p className="italic font-semibold whitespace-pre-wrap break-words min-w-0">{line.text}</p>
          </div>
        )) : <p role="status" className="text-slate-600">{connected ? "Menunggu dialog demo dari Anna…" : "Hubungkan realtime untuk menerima demo."}</p>}
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <p className="text-xs text-slate-600 font-semibold">Kedua peserta klik “Anna ready” untuk memulai obrolan. {ready && "Kamu siap; menunggu konfirmasi sesi aktif."}</p>
        <button type="button" onClick={markReady} disabled={!connected || ready || Boolean(pending) || !lines.length} className="btn btn-sm bg-emerald-500 hover:bg-emerald-600 text-white font-display border-b-2 border-emerald-700 rounded-xl px-5 shrink-0 transition-colors duration-200">{ready ? "Menunggu partner" : "Anna Ready (Saya Siap)"}</button>
      </div>
    </section>
  );
}
