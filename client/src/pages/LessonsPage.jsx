import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import AppNavbar from "../components/AppNavbar";
import LessonRow from "../components/LessonRow";
import { useAuth } from "../hooks/useAuth";
import { useLessons } from "../hooks/useLessons";
import { usePathways } from "../hooks/usePathways";
import { getPathwayMeta } from "../constant/pathwayMeta";
import { consumeJustLoggedOut } from "../utils/logoutFlag";
import { showErrorToast } from "../utils/toast";

export default function LessonsPage() {
  const { id } = useParams();
  const pathwayId = Number(id);
  const { token } = useAuth();
  const { pathways } = usePathways();
  const { lessons, status, error, fetchLessons } = useLessons();
  const navigate = useNavigate();
  const isLoading = status === "idle" || status === "loading";

  const pathway = pathways.find((item) => item.id === pathwayId);
  const meta = pathway ? getPathwayMeta(pathway.level) : null;

  useEffect(() => {
    if (!token) {
      if (!consumeJustLoggedOut()) {
        showErrorToast("Silakan masuk dulu untuk melihat lesson.");
      }
      navigate("/login", { replace: true });
      return;
    }

    if (!Number.isInteger(pathwayId) || pathwayId <= 0) {
      navigate("/pathways", { replace: true });
      return;
    }

    let cancelled = false;

    (async () => {
      const result = await fetchLessons(pathwayId, token);
      if (!cancelled && !result.ok) {
        showErrorToast(result.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, pathwayId, fetchLessons, navigate]);

  return (
    <div className="bg-slate-100 min-h-screen font-sans text-slate-800">
      <AppNavbar backTo="/pathways" />

      {/* KONTEN LESSON JOURNEY */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-10 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <Link
            to="/pathways"
            className="btn btn-ghost btn-sm rounded-xl text-xs font-bold text-slate-500 -ml-2"
          >
            &#8592; Kembali ke Pathways
          </Link>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mt-3">
            {pathway
              ? `Level ${pathway.level} • ${meta?.shortTitle ?? pathway.name} • CEFR ${pathway.cefr_level}`
              : `Pathway #${id}`}
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl mt-1">
            Perjalanan Lesson &#128506;
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Selesaikan berurutan — lesson berikutnya terbuka setelah sesi selesai
            dan dinilai.
          </p>

          {isLoading ? (
            <ol className="mt-6 space-y-3">
              {[1, 2, 3, 4].map((key) => (
                <li key={key} className="flex gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 animate-pulse shrink-0"></div>
                  <div className="flex-1 bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
                    <div className="h-3 w-1/3 bg-slate-100 rounded-lg animate-pulse"></div>
                    <div className="h-5 w-2/3 bg-slate-100 rounded-lg animate-pulse"></div>
                  </div>
                </li>
              ))}
            </ol>
          ) : status === "error" ? (
            <div className="bg-white border-2 border-rose-200 rounded-3xl p-8 shadow-sm text-center mt-6">
              <p className="font-display font-bold text-2xl text-slate-800">
                Gagal memuat lessons
              </p>
              <p className="text-xs font-bold text-slate-400 mt-1">{error}</p>
              <button
                type="button"
                onClick={() => fetchLessons(pathwayId, token)}
                className="btn mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-display border-b-4 border-emerald-700 active:border-b-0 rounded-2xl shadow"
              >
                Coba lagi
              </button>
            </div>
          ) : (
            <ol className="mt-6 space-y-3">
              {lessons.map((lesson, index) => (
                <LessonRow key={lesson.id} lesson={lesson} index={index} />
              ))}
            </ol>
          )}
        </div>

        {/* Sidebar Bantuan Sesi */}
        <aside className="space-y-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm">
            <p className="font-display font-bold text-sm text-slate-800">
              &#129302; Cara Kerja Sesi
            </p>
            <ul className="mt-3 space-y-2 text-[11px] font-semibold text-slate-500">
              <li>
                Ketik{" "}
                <span className="font-mono font-bold text-emerald-700">
                  "Anna, minta saran jawaban"
                </span>{" "}
                kapan pun kamu butuh bantuan.
              </li>
              <li>
                Ketik{" "}
                <span className="font-mono font-bold text-rose-600">"Anna finish"</span>{" "}
                untuk menutup sesi dan menerima evaluasi.
              </li>
            </ul>
          </div>
          <div className="bg-slate-800 text-white rounded-3xl p-5 shadow-sm">
            <p className="font-display font-bold text-sm">&#128101; Butuh Partner?</p>
            <p className="text-[11px] font-semibold text-slate-300 mt-2">
              Latihan selalu berdua. Undang temanmu lewat username.
            </p>
            <Link
              to="/invite"
              className="btn btn-sm mt-3 w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-display border-b-2 border-amber-600 active:border-b-0 rounded-xl shadow-sm"
            >
              Undang Partner &#8594;
            </Link>
          </div>
        </aside>
      </main>
    </div>
  );
}
