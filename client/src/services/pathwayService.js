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
