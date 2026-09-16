import { Link, useLocation } from "react-router";
import AuthNavbar from "../components/AuthNavbar";
import { useAuth } from "../hooks/useAuth";

const PAGE_LABELS = {};

export default function PlaceholderPage() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const label = PAGE_LABELS[pathname] ?? "Halaman ini";

  return (
    <div className="bg-slate-100 min-h-screen font-sans text-slate-800">
      <AuthNavbar />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-sm text-center">
          <span className="badge bg-emerald-100 text-emerald-700 border-none font-extrabold text-[11px] px-3 py-2">
            &#127881; Fitur register sudah aktif
          </span>

          <h1 className="font-display font-bold text-3xl sm:text-4xl mt-4">
            {label} belum dibangun
          </h1>

          <p className="text-sm font-semibold text-slate-500 mt-2">
            Register sudah jalan, halaman berikutnya akan menyusul satu per satu.
          </p>

          {user ? (
            <div className="mt-6 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-left">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                User tersimpan di AuthContext
              </p>
              <p className="font-display font-bold text-lg text-slate-800 mt-1">
                Halo, {user.name}!
              </p>
              <p className="text-xs font-semibold text-slate-500">
                id #{user.id} • @{user.username}
              </p>
            </div>
          ) : (
            <p className="text-xs font-bold text-slate-400 mt-6">
              Belum ada user di AuthContext — silakan daftar dulu.
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link
              to="/register"
              className="btn bg-sky-500 hover:bg-sky-600 text-white font-display border-b-4 border-sky-700 active:border-b-0 rounded-2xl shadow"
            >
              Kembali ke Register
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
