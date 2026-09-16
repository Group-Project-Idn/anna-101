import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import { sameId } from "../utils/chatState";
import ChatRoomHeader from "../components/ChatRoomHeader";
import ChatDemo from "../components/ChatDemo";
import ChatMessage from "../components/ChatMessage";
import ChatComposer from "../components/ChatComposer";

export default function ChatRoomPage() {
  const { token } = useAuth();
  const { id } = useParams();
  if (!token) return <Navigate to="/login" replace />;
  if (!/^[1-9]\d*$/.test(id)) return <Navigate to="/invite" replace />;
  return <RoomSession key={id} id={id} />;
}

function RoomSession({ id }) {
  const { openSession, status, conversation, messages, evaluation, pending, connected, error, reconnect } = useChat();
  const [attempt, setAttempt] = useState(0);
  const endRef = useRef(null);
  useEffect(() => openSession(id), [id, openSession, attempt]);
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [messages.length]);

  if (sameId(evaluation?.conversationId, id)) return <Navigate to={`/evaluation/${id}`} replace />;
  if (status === "loading" || (status === "success" && !sameId(conversation?.id, id))) {
    return <main className="min-h-screen bg-slate-100 grid place-items-center"><p role="status"><span className="loading loading-dots loading-md" /> Memuat percakapan…</p></main>;
  }
  if (status === "error") {
    return <main className="min-h-screen bg-slate-100 p-6 grid place-items-center"><section className="card bg-white border-2 border-slate-200 rounded-3xl p-6 max-w-lg"><h1 className="font-display text-2xl font-bold">Gagal memuat room</h1><p role="alert" className="my-4">{error}</p><button className="btn rounded-xl" onClick={() => setAttempt((value) => value + 1)}>Coba lagi</button><Link to="/invite" className="btn btn-ghost mt-2">Kembali ke undangan</Link></section></main>;
  }
  return (
    <div className="bg-slate-100 min-h-screen font-sans text-slate-800 flex flex-col">
      <ChatRoomHeader />
      <main className="max-w-4xl w-full mx-auto p-4 flex-1 flex flex-col gap-4">
        {error && <div role="alert" className="alert bg-amber-50 border-amber-200 text-amber-900"><span>{error}</span>{!connected && conversation?.status !== "completed" && <button type="button" className="btn btn-sm" onClick={reconnect}>Hubungkan ulang</button>}</div>}
        {!connected && !error && conversation?.status !== "completed" && <p role="status" className="text-xs text-slate-600">Menghubungkan realtime…</p>}
        {conversation?.status !== "active" && conversation?.status !== "completed" && <ChatDemo />}
        <section aria-label="Riwayat percakapan" className="space-y-4 my-2 px-1 flex-1">
          <p className="text-center text-xs font-bold text-slate-500">Sesi {id} • {conversation?.status === "completed" ? "Selesai" : conversation?.status === "active" ? "Obrolan dimulai" : "Persiapan latihan"}</p>
          {!messages.length && <p className="text-center text-sm text-slate-500 py-8">Belum ada pesan. Mulai percakapan setelah sesi aktif.</p>}
          {messages.map((message) => <ChatMessage key={message.id} message={message} />)}
          {pending && <p role="status" className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-3 py-2 rounded-full w-fit mx-auto"><span className="loading loading-dots loading-xs text-amber-500" />{pending === "finish" ? "Anna sedang menyiapkan evaluasi…" : pending === "suggestion" ? "Menunggu saran dari Anna…" : pending === "ready" ? "Menunggu sesi aktif…" : "Menunggu konfirmasi pesan…"}</p>}
          <div ref={endRef} />
        </section>
        {conversation?.status === "completed" && <Link to={`/evaluation/${id}`} className="btn rounded-xl">Lihat evaluasi sesi</Link>}
        <ChatComposer />
      </main>
    </div>
  );
}
