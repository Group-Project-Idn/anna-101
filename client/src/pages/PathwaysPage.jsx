import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import AppNavbar from "../components/AppNavbar";
import PathwayCard from "../components/PathwayCard";
import { useAuth } from "../hooks/useAuth";
import { usePathways } from "../hooks/usePathways";
import { getPathwayMeta, resolvePathwayCta } from "../constant/pathwayMeta";
import { consumeJustLoggedOut } from "../utils/logoutFlag";
import { showErrorToast } from "../utils/toast";

export default function PathwaysPage() {
  const { token } = useAuth();
  const { pathways, progressByPathway, status, error, fetchPathways } =
    usePathways();
  const navigate = useNavigate();
  const isLoading = status === "idle" || status === "loading";

  useEffect(() => {
    if (!token) {
      // Lewatkan toast sekali setelah logout — user memang sengaja ke
      // /login, bukan "ditolak masuk". Akses tanpa token di lain waktu
      // tetap menampilkan toast seperti biasa.
      if (!consumeJustLoggedOut()) {
        showErrorToast("Silakan masuk dulu untuk melihat pathway.");
      }
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    (async () => {
      const result = await fetchPathways(token);
      if (!cancelled && !result.ok) {
        showErrorToast(result.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, fetchPathways, navigate]);

  return (
    <div className="bg-slate-100 min-h-screen font-sans text-slate-800">
      <AppNavbar active="pathways" />

      {/* KONTEN PATHWAYS */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
              Kurikulum American English
            </p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl mt-1">
              Pilih Pathway Kamu &#128506;
            </h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">
              Empat level, dari A1 sampai B2. Setiap lesson dilatih live berdua —
              bukan sendirian.
            </p>
          </div>

          {/* Angka progress per kartu diambil dari GET /api/pathways/progress
              (lihat PathwayProvider + resolvePathwayCta). */}
        </div>

        {isLoading ? (
          <div className="grid gap-4 mt-6 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((key) => (
              <div
                key={key}
                className="bg-white border-2 border-slate-200 rounded-3xl shadow-sm overflow-hidden"
              >
                <div className="bg-slate-200 px-5 py-4 animate-pulse">
                  <div className="h-4 w-2/3 bg-white/70 rounded-lg"></div>
                  <div className="h-6 w-1/2 bg-white/70 rounded-lg mt-2"></div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="h-3 w-3/4 bg-slate-100 rounded-lg animate-pulse"></div>
                  <div className="h-2 bg-slate-100 rounded-full animate-pulse"></div>
                  <div className="h-10 bg-slate-100 rounded-2xl animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : status === "error" ? (
          <div className="bg-white border-2 border-rose-200 rounded-3xl p-8 shadow-sm text-center mt-6">
            <p className="font-display font-bold text-2xl text-slate-800">
              Gagal memuat pathways
            </p>
            <p className="text-xs font-bold text-slate-400 mt-1">{error}</p>
            <button
              type="button"
              onClick={() => fetchPathways(token)}
              className="btn mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-display border-b-4 border-emerald-700 active:border-b-0 rounded-2xl shadow"
            >
              Coba lagi
            </button>
            <p className="text-xs font-bold text-slate-500 mt-4">
              <Link to="/login" className="text-emerald-700 underline">
                Kembali masuk
              </Link>{" "}
              kalau token kamu kedaluwarsa.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 mt-6 sm:grid-cols-2 xl:grid-cols-4">
            {pathways.map((pathway) => (
              <PathwayCard
                key={pathway.id}
                pathway={pathway}
                meta={getPathwayMeta(pathway.level)}
                resolved={resolvePathwayCta(
                  progressByPathway[pathway.id],
                  getPathwayMeta(pathway.level),
                )}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
