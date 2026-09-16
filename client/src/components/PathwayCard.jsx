import { Link } from "react-router";

const CTA_STYLES = {
  emerald:
    "bg-emerald-500 hover:bg-emerald-600 text-white border-b-4 border-emerald-700 active:border-b-0 rounded-2xl shadow",
  ghost:
    "bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-200 rounded-2xl",
};

export default function PathwayCard({ pathway, meta, resolved }) {
  const view = resolved ?? {
    cta: meta.cta,
    ctaStyle: meta.ctaStyle,
    done: meta.done,
    total: meta.total,
    locked: meta.locked,
    lockNote: meta.lockNote,
  };
  const percent = view.total > 0 ? Math.round((view.done / view.total) * 100) : 0;

  if (view.locked) {
    return (
      <article className="bg-white border-2 border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col opacity-80">
        <div className={`${meta.headerBg} px-5 py-4`}>
          <span className="badge bg-white/70 text-slate-600 border-none text-[10px] font-extrabold">
            LEVEL {pathway.level} &#8226; CEFR {pathway.cefr_level}
          </span>
          <h2 className="font-display font-bold text-xl text-slate-500 mt-2">
            {meta.shortTitle}
          </h2>
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <p className="text-xs font-semibold text-slate-400">{meta.subtitle}</p>
          <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full ${meta.barBg} rounded-full`}
              style={{ width: `${percent}%` }}
            ></div>
          </div>
          <p className="text-[11px] font-bold text-slate-400 mt-2">
            &#128274; {view.lockNote}
          </p>
          <button
            type="button"
            disabled
            className="btn mt-4 w-full bg-slate-200 text-slate-400 border-none rounded-2xl cursor-not-allowed"
          >
            &#128274; {view.cta}
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="bg-white border-2 border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
      <div className={`${meta.headerBg} px-5 py-4`}>
        <span
          className={`badge bg-white/70 border-none text-[10px] font-extrabold ${meta.badgeText}`}
        >
          LEVEL {pathway.level} &#8226; CEFR {pathway.cefr_level}
        </span>
        <h2 className={`font-display font-bold text-xl mt-2 ${meta.titleText}`}>
          {meta.shortTitle}
        </h2>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <p className="text-xs font-semibold text-slate-500">{meta.subtitle}</p>
        <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full ${meta.barBg} rounded-full`}
            style={{ width: `${percent}%` }}
          ></div>
        </div>
        <p className="text-[11px] font-bold text-slate-400 mt-2">
          {view.done} dari {view.total} lesson selesai
        </p>
        <Link
          to={`/lessons/${pathway.id}`}
          className={`btn mt-4 w-full font-display ${CTA_STYLES[view.ctaStyle]}`}
        >
          {view.cta}
        </Link>
      </div>
    </article>
  );
}
