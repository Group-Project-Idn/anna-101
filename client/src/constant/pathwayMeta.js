/**
 * Data presentasi per level pathway.
 * API GET /api/pathways hanya mengembalikan { id, name, level, cefr_level },
 * jadi judul pendek, subtitle, dan warna dipetakan di sini supaya tampilannya
 * identik dengan template /static/pathways.html.
 *
 * Angka progress TIDAK lagi dipalsukan di sini: sumbernya
 * GET /api/pathways/progress (lihat resolvePathwayCta). done/total 0 hanya
 * nilai netral kalau data progress belum sempat termuat.
 */
export const PATHWAY_META = {
  1: {
    shortTitle: "Absolute Beginner",
    subtitle: "Sapaan, hobi, olahraga.",
    headerBg: "bg-amber-400",
    badgeText: "text-amber-900",
    titleText: "text-slate-900",
    barBg: "bg-amber-400",
    cta: "Mulai →",
    ctaStyle: "ghost",
    done: 0,
    total: 0,
    locked: false,
  },
  2: {
    shortTitle: "Elementary",
    subtitle: "Makanan, rutinitas, small talk.",
    headerBg: "bg-sky-400",
    badgeText: "text-sky-900",
    titleText: "text-white",
    barBg: "bg-sky-400",
    cta: "Mulai →",
    ctaStyle: "ghost",
    done: 0,
    total: 0,
    locked: false,
  },
  3: {
    shortTitle: "Intermediate",
    subtitle: "Opini, rencana, cerita.",
    headerBg: "bg-emerald-500",
    badgeText: "text-emerald-900",
    titleText: "text-white",
    barBg: "bg-emerald-500",
    cta: "Mulai →",
    ctaStyle: "ghost",
    done: 0,
    total: 0,
    locked: false,
  },
  4: {
    shortTitle: "Upper Intermediate",
    subtitle: "Debat, presentasi, idiom.",
    headerBg: "bg-slate-200",
    badgeText: "text-slate-600",
    titleText: "text-slate-500",
    barBg: "bg-slate-300",
    cta: "Terkunci",
    ctaStyle: "disabled",
    done: 0,
    total: 0,
    locked: true,
    lockNote: "Terbuka setelah Level 3 selesai",
  },
};

const DEFAULT_META = {
  shortTitle: "",
  subtitle: "",
  headerBg: "bg-slate-200",
  badgeText: "text-slate-600",
  titleText: "text-slate-500",
  barBg: "bg-slate-300",
  cta: "Lihat",
  ctaStyle: "ghost",
  done: 0,
  total: 0,
  locked: false,
};

export function getPathwayMeta(level) {
  return PATHWAY_META[level] ?? { ...DEFAULT_META };
}

/**
 * Hitung label CTA + progress bar dari data progress server.
 * Sumber: GET /api/pathways/progress (per pathway: total_lessons,
 * completed_lessons). Aturan sesuai api-contract:
 * terkunci -> "Terkunci", 0 selesai -> "Mulai", sebagian -> "Lanjutkan",
 * penuh -> "Ulangi". Kalau response progress tidak tersedia sama sekali,
 * dipakai nilai netral (0 dari 0) — bukan angka karangan.
 */
export function resolvePathwayCta(progress, meta) {
  if (!progress) {
    return {
      cta: meta.locked ? "Terkunci" : "Mulai →",
      ctaStyle: meta.locked ? "disabled" : "ghost",
      done: 0,
      total: 0,
      locked: !!meta.locked,
      lockNote: meta.lockNote,
    };
  }

  const total = progress.total_lessons ?? 0;
  const done = progress.completed_lessons ?? 0;

  if (total <= 0 || meta.locked) {
    return {
      cta: "Terkunci",
      ctaStyle: "disabled",
      done,
      total,
      locked: true,
      lockNote: meta.lockNote ?? "Selesaikan level sebelumnya dulu",
    };
  }

  if (done <= 0) {
    return { cta: "Mulai →", ctaStyle: "ghost", done, total, locked: false };
  }

  if (done < total) {
    return { cta: "Lanjutkan →", ctaStyle: "emerald", done, total, locked: false };
  }

  return { cta: "Ulangi", ctaStyle: "ghost", done, total, locked: false };
}
