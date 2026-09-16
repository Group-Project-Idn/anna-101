import axios from "axios";
import { baseUrl } from "../constant/baseUrl";

/**
 * GET /api/pathways/:id/lessons (butuh header Authorization: Bearer <token>)
 * Response 200: [{ id, title, status: "locked"|"unlocked"|"completed", score }]
 */
export async function fetchLessons(pathwayId, token) {
  const { data } = await axios.get(`${baseUrl}/pathways/${pathwayId}/lessons`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data;
}
