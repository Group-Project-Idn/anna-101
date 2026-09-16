import axios from "axios";
import { baseUrl } from "../constant/baseUrl";

/**
 * POST /api/auth/register
 * Response 201: { user: { id, name, username }, token }
 */
export async function registerUser({ name, username, email, password }) {
  const { data } = await axios.post(`${baseUrl}/auth/register`, {
    name: name.trim(),
    username: username.trim(),
    email: email.trim(),
    password,
  });

  return { user: data.user, token: data.token };
}

/**
 * POST /api/auth/login
 * Response 200: { user: { id, name, username }, token }
 */
export async function loginUser({ email, password }) {
  const { data } = await axios.post(`${baseUrl}/auth/login`, {
    email: email.trim(),
    password,
  });

  return { user: data.user, token: data.token };
}
