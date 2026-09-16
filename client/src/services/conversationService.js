import axios from "axios";
import { baseUrl } from "../constant/baseUrl";

function authHeaders(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

/**
 * GET /api/conversations/:id (butuh Bearer token)
 * Response 200: { id, lesson_id, status, participants: [{ user_id, username }] }
 */
export async function fetchConversation(token, conversationId) {
  const { data } = await axios.get(
    `${baseUrl}/conversations/${conversationId}`,
    authHeaders(token),
  );

  return data;
}

/**
 * GET /api/conversations/:id/messages (butuh Bearer token)
 * Response 200: [{ id, sender_type, sender_id, message_type, content, created_at }]
 */
export async function fetchMessages(token, conversationId) {
  const { data } = await axios.get(
    `${baseUrl}/conversations/${conversationId}/messages`,
    authHeaders(token),
  );

  return data ?? [];
}
