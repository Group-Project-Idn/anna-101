import axios from "axios";
import { baseUrl } from "../constant/baseUrl";

/**
 * GET /api/pathways (butuh header Authorization: Bearer <token>)
 * Response 200: [{ id, name, level, cefr_level }]
 */
export async function fetchPathways(token) {
  const { data } = await axios.get(`${baseUrl}/pathways`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data;
}

/**
 * GET /api/pathways/progress (butuh Bearer token) — agregat progres user.
 * Response 200: [{ pathway_id, name, level, cefr_level, total_lessons,
 *                  completed_lessons, progress_rate, unlocked_lesson_id,
 *                  last_attempt }]
 * Dipakai kartu pathway untuk label CTA + progress bar. Kalau request gagal,
 * pemanggil memakai nilai netral (lihat resolvePathwayCta).
 */
export async function fetchPathwayProgress(token) {
  const { data } = await axios.get(`${baseUrl}/pathways/progress`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data;
}
