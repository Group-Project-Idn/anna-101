# API Contract — Anna-101

Base URL: `https://api.anna101.com`
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
  "username": "budi99",
  "email": "budi@mail.com",
  "password": "secret123"
}
```

**Response** `201`

```json
{
  "user": { "id": 1, "name": "Budi", "username": "budi99" },
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
  "user": { "id": 1, "name": "Budi", "username": "budi99" },
  "token": "jwt_token_here"
}
```

---

## 2. Pathways & Lessons

### GET `/api/pathways`

**Response** `200`

```json
[
  {
    "id": 1,
    "name": "Level 1 American English",
    "level": 1,
    "cefr_level": "A1"
  }
]
```

### GET `/api/pathways/:id/lessons`

**Response** `200`

```json
[
  {
    "id": 5,
    "title": "Talking About Sports",
    "status": "unlocked",
    "score": null
  },
  {
    "id": 4,
    "title": "Asking About Hobbies",
    "status": "completed",
    "score": 5
  }
]
```

> `status`: `locked` | `unlocked` | `completed`

---

## 3. Invite (mengundang partner by username)

### POST `/api/invites`

Mengundang user lain untuk berlatih bareng di 1 lesson.

**Request**

```json
{ "lesson_id": 5, "to_username": "sari_21" }
```

**Response** `201`

```json
{ "id": 30, "lesson_id": 5, "to_username": "sari_21", "status": "pending" }
```

> `400` kalau username tidak ditemukan atau lesson masih `locked`.

### GET `/api/invites`

List undangan masuk & keluar milik user yang sedang login.

**Response** `200`

```json
{
  "incoming": [
    {
      "id": 31,
      "from_username": "andi",
      "lesson_title": "Talking About Sports",
      "status": "pending"
    }
  ],
  "outgoing": [
    {
      "id": 30,
      "to_username": "sari_21",
      "lesson_title": "Talking About Sports",
      "status": "pending"
    }
  ]
}
```

### PATCH `/api/invites/:id/accept`

Menerima undangan → otomatis membuat `conversation` baru.

**Response** `200`

```json
{ "invite_id": 31, "status": "accepted", "conversation_id": 101 }
```

Frontend langsung `join room` socket.io pakai `conversation_id` ini.

### PATCH `/api/invites/:id/reject`

**Response** `200`

```json
{ "invite_id": 31, "status": "rejected" }
```

---

## 4. Conversation (Chat Session)

### GET `/api/conversations/:id`

**Response** `200`

```json
{
  "id": 101,
  "lesson_id": 5,
  "status": "active",
  "participants": [
    { "user_id": 1, "username": "budi99" },
    { "user_id": 2, "username": "sari_21" }
  ]
}
```

### GET `/api/conversations/:id/messages`

Ambil history chat asli (di luar demo, karena demo tidak disimpan).

**Response** `200`

```json
[
  {
    "id": 1,
    "sender_type": "user",
    "sender_id": 1,
    "message_type": "chat",
    "content": "Hi Sari, do you follow any sports?"
  },
  {
    "id": 2,
    "sender_type": "ai",
    "sender_id": null,
    "message_type": "suggestion",
    "content": "Try: 'Yes, I love football!'"
  }
]
```

---

## 5. Socket.io Events

### Join room

```js
socket.emit("conversation:join", { conversationId: 101 });
```

### Fase demo (opening greeting contoh)

Digenerate AI saat room baru terbentuk, **tidak disimpan ke DB** — cuma ditampilkan sementara.

```js
socket.on("demo:script", (data) => {
  // data.lines = [{ speaker: "A", text: "..." }, { speaker: "B", text: "..." }, ...] min 10 kalimat/orang
});
```

Setelah user siap, kirim:

```js
socket.emit("demo:ready", { conversationId: 101 });
// server hapus demo dari state, ubah conversation.status jadi "active", broadcast ke kedua user
socket.on("conversation:active", () => {
  /* mulai real chat */
});
```

### Chat asli antar 2 user

```js
socket.emit("message:send", {
  conversationId: 101,
  content: "Hi Sari, do you follow any sports?",
});

socket.on("message:new", (msg) => {
  // { id, conversationId, sender_type: "user", sender_id, message_type: "chat", content, created_at }
});
```

### Minta saran ke AI ("Anna, minta saran jawaban")

```js
socket.emit("suggestion:request", { conversationId: 101 });

socket.on("message:new", (msg) => {
  // { id, sender_type: "ai", sender_id: null, message_type: "suggestion", content: "Try: '...'" }
});
```

> Pesan saran ini ikut tersimpan di `MESSAGES` (beda dari demo) supaya kelihatan di history — tapi ditandai `message_type: "suggestion"` biar frontend bisa styling beda (misal warna berbeda, ga dihitung sebagai giliran chat).

### Selesai sesi ("Anna finish")

```js
socket.emit("session:finish", { conversationId: 101 });

socket.on("session:evaluation", (data) => {
  // dikirim ke MASING-MASING user, isinya evaluasi dia sendiri
  // { conversationId: 101, user_id: 1, strengths: "...", evaluation: "...", score: 4 }
});
```

Event ini yang men-trigger insert ke `SESSION_EVALUATIONS` (1 baris per partisipan) dan update `USER_LESSON_PROGRESS.status` jadi `completed`.

### Error

```js
socket.on("error", (err) => {
  /* { message: "..." } */
});
```

---

## Ringkasan Status Code

| Code | Arti                                                          |
| ---- | ------------------------------------------------------------- |
| 200  | OK                                                            |
| 201  | Created                                                       |
| 400  | Request tidak valid / username tidak ditemukan                |
| 401  | Token tidak ada/invalid                                       |
| 403  | Lesson masih `locked`, atau bukan partisipan conversation ini |
| 404  | Data tidak ditemukan                                          |
| 500  | Server/Gemini API error                                       |
