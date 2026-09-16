import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

/**
 * Navbar journey-only: brand + tombol kembali opsional + chip user.
 * TIDAK ada menu Pathways/Lesson/Invite/Chat/Evaluasi — navigasi antar
 * halaman hanya lewat CTA journey (Mulai/Lanjutkan/Jelajahi, Latihan/Ulangi,
 * Terima undangan). Lihat README alur belajar.
 */
export default function AppNavbar({ backTo }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  // Sembunyikan tombol Keluar di halaman yang tidak butuh auth
  // (login/register) supaya tidak bisa diklik saat tidak ada user.
  const hideLogout = ["/login", "/register"].includes(location.pathname);

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <Link to="/pathways" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-2xl bg-amber-400 flex items-center justify-center text-lg shadow-sm">
            &#129417;
          </div>
          <div className="leading-tight">
            <p className="font-display font-bold text-base text-slate-800">Anna-101</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Belajar Berdua + AI
            </p>
          </div>
        </Link>
        {backTo ? (
          <Link
            to={backTo}
            className="btn btn-ghost btn-sm rounded-xl text-xs font-bold text-slate-500"
          >
            &#8592; Kembali
          </Link>
        ) : null}
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-right leading-tight">
            <p className="text-xs font-bold text-slate-700">{user?.name ?? "Teman"}</p>
            <p className="text-[10px] font-mono text-slate-400">@{user?.username ?? "-"}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-display font-bold border-2 border-white shadow-sm">
            {initial}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            hidden={hideLogout}
            className="btn btn-ghost btn-sm rounded-xl text-xs font-bold text-slate-500"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>
  );
}
