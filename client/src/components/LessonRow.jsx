import { Link } from "react-router";

/**
 * Satu baris journey lesson, mengikuti template /static/lessons.html.
 * - completed: node hijau + skor + tombol "Ulangi" -> /invite?lesson=<id>
 * - unlocked: kartu aktif + tombol "Latihan" -> /invite?lesson=<id>
 * - locked: node gembok, tanpa tombol
 */
export default function LessonRow({ lesson, index }) {
  const number = String(index + 1).padStart(2, "0");

  if (lesson.status === "locked") {
    return (
      <li className="flex gap-3 opacity-70">
        <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-400 flex items-center justify-center font-display font-bold shadow-sm shrink-0">
          &#128274;
        </div>
        <div className="flex-1 bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Lesson {number} &#8226; Terkunci
          </p>
          <h2 className="font-display font-bold text-lg text-slate-400">{lesson.title}</h2>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">
            Selesaikan lesson sebelumnya dulu untuk membuka lesson ini.
          </p>
        </div>
      </li>
    );
  }

  if (lesson.status === "unlocked") {
    return (
      <li className="flex gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center font-display font-bold shadow-sm shrink-0 ring-4 ring-amber-100">
          {index + 1}
        </div>
        <div className="flex-1 bg-white border-2 border-amber-300 rounded-2xl p-4 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                Lesson {number} &#8226; Sedang Berjalan
              </p>
              <h2 className="font-display font-bold text-lg text-slate-800">
                {lesson.title}
              </h2>
            </div>
            <Link
              to={`/invite?lesson=${lesson.id}`}
              className="btn btn-sm bg-emerald-500 hover:bg-emerald-600 text-white font-display border-b-2 border-emerald-700 active:border-b-0 rounded-xl shadow-sm"
            >
              Latihan &#128172;
            </Link>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="flex gap-3">
      <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-display font-bold shadow-sm shrink-0">
        &#10003;
      </div>
      <div className="flex-1 bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
              Lesson {number} &#8226; Selesai
              {lesson.score != null ? ` &#8226; Skor ${lesson.score}/5` : ""}
            </p>
            <h2 className="font-display font-bold text-lg text-slate-800">
              {lesson.title}
            </h2>
          </div>
          <Link
            to={`/invite?lesson=${lesson.id}`}
            className="btn btn-xs bg-slate-100 hover:bg-slate-200 text-slate-600 border-2 border-slate-200 rounded-xl font-bold"
          >
            Ulangi
          </Link>
        </div>
      </div>
    </li>
  );
}
