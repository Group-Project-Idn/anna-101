import axios from "axios";
import { baseUrl } from "../constant/baseUrl";

function authHeaders(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

/**
 * GET /api/invites?limit=&offset= (butuh Bearer token)
 * Response 200: { incoming: [...], outgoing: [...], meta: { limit, offset } }
 */
export async function fetchInvites(token, { limit = 20, offset = 0 } = {}) {
  const { data } = await axios.get(
    `${baseUrl}/invites?limit=${limit}&offset=${offset}`,
    authHeaders(token),
  );

  return {
    incoming: data.incoming ?? [],
    outgoing: data.outgoing ?? [],
    meta: data.meta ?? { limit, offset },
  };
}

/**
 * Fallback REST bila socket belum siap:
 * POST /api/invites { lesson_id, to_username } -> 201 invite pending
 */
export async function createInvite(token, { lessonId, toUsername }) {
  const { data } = await axios.post(
    `${baseUrl}/invites`,
    { lesson_id: lessonId, to_username: toUsername },
    authHeaders(token),
  );

  return data;
}
