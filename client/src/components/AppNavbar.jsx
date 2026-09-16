import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

/**
 * Navbar journey: brand + menu Pathways/Invite + chip user.
 * Lesson/Chat Room/Evaluasi TETAP tidak ada — hanya bisa dicapai lewat
 * CTA journey (Latihan/Ulangi -> Invite -> Terima -> Chat Room).
 */
const NAV_LINKS = [
  { key: "pathways", to: "/pathways", label: "Pathways" },
  { key: "invite", to: "/invite", label: "Invite" },
];

export default function AppNavbar({ backTo, active }) {
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
        ) : (
          <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-500">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.key}
                to={link.to}
                className={
                  active === link.key
                    ? "px-3 py-2 rounded-xl bg-amber-100 text-amber-900"
                    : "px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-slate-800"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
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
      {/* Nav mobile hanya untuk menu utama (tanpa tombol kembali). */}
      {!backTo ? (
        <nav className="md:hidden flex items-center gap-1 overflow-x-auto px-4 pb-2 text-xs font-bold text-slate-500">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              to={link.to}
              className={
                active === link.key
                  ? "px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 shrink-0"
                  : "px-3 py-1.5 rounded-xl bg-slate-100 shrink-0"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
