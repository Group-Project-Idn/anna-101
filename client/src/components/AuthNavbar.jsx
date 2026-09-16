import { Link } from "react-router";

export default function AuthNavbar() {
  return (
    <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <Link to="/register" className="flex items-center gap-2.5 shrink-0">
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
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="btn btn-ghost btn-sm rounded-xl text-xs font-bold text-slate-500"
          >
            Masuk
          </Link>
          <Link
            to="/register"
            className="btn btn-sm bg-emerald-500 hover:bg-emerald-600 text-white font-display border-b-2 border-emerald-700 rounded-xl shadow-sm text-xs active:scale-95"
          >
            Daftar Gratis
          </Link>
        </div>
      </div>
    </header>
  );
}
