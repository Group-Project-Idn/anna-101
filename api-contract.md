# API Contract — English Learning Chat App

Base URL: `https://api.yourapp.com`
Semua endpoint (kecuali auth) butuh header:

```
Authorization: Bearer <jwt_token>
```

---

## 1. Auth

### POST `/api/auth/register`

**Request**

```json
{
  "name": "Budi",
  "email": "budi@mail.com",
  "password": "secret123"
}
```

**Response** `201`

```json
{
  "user": { "id": 1, "name": "Budi", "email": "budi@mail.com" },
  "token": "jwt_token_here"
}
```

### POST `/api/auth/login`

**Request**

```json
{ "email": "budi@mail.com", "password": "secret123" }
```

**Response** `200`

```json
{
  "user": { "id": 1, "name": "Budi", "email": "budi@mail.com" },
  "token": "jwt_token_here"
}
```

### GET `/api/auth/me`

**Response** `200`

```json
{ "id": 1, "name": "Budi", "email": "budi@mail.com", "current_pathway_id": 1 }
```

---

## 2. Pathways & Lessons

### GET `/api/pathways`

List semua pathway (Level 1-4).

**Response** `200`

```json
[
  {
    "id": 1,
    "name": "Level 1 American English",
    "level": 1,
    "cefr_level": "A1",
    "order": 1
  },
  {
    "id": 2,
    "name": "Level 2 American English",
    "level": 2,
    "cefr_level": "A2",
    "order": 2
  }
]
```

### GET `/api/pathways/:id/lessons`

List lesson dalam 1 pathway, sudah termasuk status progress user.

**Response** `200`

```json
[
  {
    "id": 5,
    "title": "Talking About Sports",
    "order": 5,
    "estimated_minutes": 3,
    "status": "unlocked",
    "score": null
  },
  {
    "id": 4,
    "title": "Asking About Hobbies",
    "order": 4,
    "estimated_minutes": 3,
    "status": "completed",
    "score": 5
  }
]
```

> `status`: `locked` | `unlocked` | `completed`

### GET `/api/lessons/:id`

Detail 1 lesson (dipakai di halaman sebelum mulai chat).

**Response** `200`

```json
{
  "id": 5,
  "pathway_id": 1,
  "title": "Talking About Sports",
  "estimated_minutes": 3,
  "vocabulary": [
    {
      "word": "referee",
      "meaning": "wasit",
      "example_sentence": "The referee blew the whistle."
    }
  ]
}
```

> `topic_prompt` **tidak** dikirim ke frontend — itu dipakai backend doang buat ngarahin Gemini.

---

## 3. Conversation (Chat Session)

### POST `/api/conversations`

Mulai sesi chat baru untuk 1 lesson.

**Request**

```json
{ "lesson_id": 5 }
```

**Response** `201`

```json
{
  "id": 101,
  "lesson_id": 5,
  "started_at": "2026-09-16T10:00:00Z"
}
```

Frontend lanjut `join room` socket.io pakai `conversation_id` ini.

### GET `/api/conversations/:id/messages`

Ambil history chat (dipakai kalau user refresh halaman).

**Response** `200`

```json
[
  {
    "id": 1,
    "role": "ai",
    "content": "Hi! Do you follow any sports?",
    "created_at": "2026-09-16T10:00:05Z"
  },
  {
    "id": 2,
    "role": "user",
    "content": "Yes, I like football.",
    "created_at": "2026-09-16T10:00:20Z"
  }
]
```

### PATCH `/api/conversations/:id/end`

Tandai sesi selesai + trigger penilaian (AI kasih skor).

**Response** `200`

```json
{
  "id": 101,
  "ended_at": "2026-09-16T10:05:00Z",
  "score": 5,
  "lesson_status": "completed"
}
```

Ini juga yang meng-update `user_lesson_progress` di belakang layar.

---

## 4. Progress

### GET `/api/users/me/progress`

Ringkasan progress user (buat dashboard/journey view).

**Response** `200`

```json
[
  { "lesson_id": 1, "status": "completed", "score": 5 },
  { "lesson_id": 2, "status": "completed", "score": 4 },
  { "lesson_id": 3, "status": "unlocked", "score": null }
]
```

---

## 5. Socket.io Events (Real-time Chat)

**Connect & join room**

```js
socket.emit("conversation:join", { conversationId: 101 });
```

**Client → Server** — kirim pesan user

```js
socket.emit("message:send", {
  conversationId: 101,
  content: "Yes, I like football.",
});
```

**Server → Client** — balasan tersimpan dari user (echo/ack)

```js
socket.on("message:new", (msg) => {
  // { id: 2, conversationId: 101, role: "user", content: "...", created_at: "..." }
});
```

**Server → Client** — AI lagi mikir (opsional, buat UX "typing...")

```js
socket.on("ai:typing", () => {
  /* show typing indicator */
});
```

**Server → Client** — balasan AI (Gemini)

```js
socket.on("message:new", (msg) => {
  // { id: 3, conversationId: 101, role: "ai", content: "...", created_at: "..." }
});
```

> Event `message:new` dipakai bareng buat pesan user & AI — frontend bedain lewat field `role`.

**Server → Client** — error (misal Gemini API gagal)

```js
socket.on("error", (err) => {
  // { message: "Failed to get AI response, please retry." }
});
```

---

## Ringkasan Status Code

| Code | Arti                                            |
| ---- | ----------------------------------------------- |
| 200  | OK                                              |
| 201  | Created                                         |
| 400  | Request tidak valid (field kosong/salah format) |
| 401  | Token tidak ada/invalid                         |
| 403  | Lesson masih `locked`, tidak boleh diakses      |
| 404  | Data tidak ditemukan                            |
| 500  | Server/Gemini API error                         |
