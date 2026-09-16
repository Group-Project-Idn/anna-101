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
 * GET /api/pathways/progress (butuh Bearer token) — USULAN di api-contract.
 * Response 200: [{ pathway_id, total_lessons, completed_lessons, unlocked_lesson_id }]
 * Belum diimplementasikan server: panggil dalam try/catch sendiri, 404 = pakai dummy.
 */
export async function fetchPathwayProgress(token) {
  const { data } = await axios.get(`${baseUrl}/pathways/progress`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data;
}
