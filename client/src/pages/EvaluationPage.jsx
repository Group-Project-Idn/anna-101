import { Link, Navigate, useParams } from "react-router";
import AppNavbar from "../components/AppNavbar";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import { sameId } from "../utils/chatState";

export default function EvaluationPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const { evaluation, conversation } = useChat();
  if (!token) return <Navigate to="/login" replace />;
  const available = sameId(evaluation?.conversationId, id) && sameId(evaluation?.user_id, user?.id);
  const partner = conversation?.participants?.find((person) => !sameId(person.user_id, user?.id));
  return (
    <div className="bg-slate-100 min-h-screen font-sans text-slate-800">
      <AppNavbar />
      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
        {!available ? (
          <section className="card bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h1 className="font-display font-bold text-3xl">Evaluasi belum tersedia</h1>
            <p role="status" className="my-4 text-sm text-slate-600">Evaluasi diterima setelah Anna menyelesaikan sesi. Hasil hanya tersedia selama sesi aplikasi ini; setelah refresh, kontrak API belum menyediakan endpoint untuk mengambilnya kembali.</p>
            <Link to={`/chat-room/${id}`} className="btn bg-emerald-500 text-white rounded-2xl">Kembali ke room</Link>
            <Link to="/pathways" className="btn btn-ghost rounded-2xl mt-2">Kembali ke pathways</Link>
          </section>
        ) : (
          <>
            <div className="text-center">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Sesi {id} • Lesson {conversation?.lesson_id}{conversation?.lesson_title && ` • ${conversation.lesson_title}`}</p>
              <h1 className="font-display font-bold text-3xl sm:text-4xl mt-1">Kerja bagus, {user?.name || user?.username}! 🎉</h1>
              <p className="text-sm font-semibold text-slate-500 mt-1">Ringkasan sesi latihanmu{partner?.username && ` bersama @${partner.username}`}, dibuat khusus oleh Anna.</p>
            </div>
            <section className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm mt-6">
              <div className="text-center">
                <p className="font-display font-bold text-6xl text-amber-500 leading-none">{evaluation.score ?? "—"}<span className="text-2xl text-slate-500">/5</span></p>
                <p className="text-[11px] font-extrabold text-emerald-700 mt-2">✓ Lesson {conversation?.lesson_id} ditandai selesai</p>
              </div>
              <div className="grid gap-4 mt-7 sm:grid-cols-2">
                <EvaluationSection title="💪 Kelebihan Kamu" content={evaluation.strengths} variant="strengths" />
                <EvaluationSection title="🎯 Evaluasi & Saran" content={evaluation.evaluation} variant="evaluation" />
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-7">
                <Link to={conversation?.pathway_id ? `/lessons/${conversation.pathway_id}` : "/pathways"} className="btn bg-emerald-500 hover:bg-emerald-600 text-white font-display border-b-4 border-emerald-700 rounded-2xl transition-colors duration-200">Lanjut Belajar →</Link>
                <Link to="/invite" className="btn bg-white hover:bg-slate-100 text-slate-700 font-display border-2 border-slate-200 rounded-2xl transition-colors duration-200">Latihan Lagi 🔁</Link>
              </div>
            </section>
            <div className="mt-4 bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] font-semibold text-slate-500">Evaluasi ini dibuat khusus untukmu — partner kamu menerima evaluasinya sendiri.</p>
              <span className="badge badge-outline badge-sm font-bold">user_id {evaluation.user_id}</span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function EvaluationSection({ title, content, variant }) {
  const colors = variant === "strengths" ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-amber-50 border-amber-200 text-amber-900";
  return <section className={`border-2 rounded-3xl p-5 ${colors}`}><h2 className="font-display font-bold text-base">{title}</h2><p className="mt-3 text-xs font-semibold whitespace-pre-wrap break-words">{content || "Belum ada catatan dari Anna."}</p></section>;
}
