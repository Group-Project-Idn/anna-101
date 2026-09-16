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

> Catatan frontend: response ini belum membawa progress user, jadi label
> CTA kartu pathway ("Mulai" / "Lanjutkan") dan progress bar untuk saat ini
> memakai data presentasi lokal di client. Kalau nanti butuh progress nyata,
> ajukan endpoint `GET /api/pathways/progress` (usulan response di bawah)
> agar label CTA bisa dihitung dari data server, bukan dummy.

### GET `/api/pathways/progress` (USULAN — belum diimplementasikan)

Agregat progres user login per pathway, dipakai untuk menentukan label CTA
kartu ("Mulai" vs "Lanjutkan") dan mengisi progress bar tanpa 4x request
`GET /api/pathways/:id/lessons`.

**Response** `200` (usulan)

```json
[
  {
    "pathway_id": 1,
    "total_lessons": 6,
    "completed_lessons": 4,
    "unlocked_lesson_id": 5
  }
]
```

Aturan label CTA yang disepakati (dihitung di client dari response di atas):

| Kondisi | Label CTA |
| --- | --- |
| `total_lessons === 0` atau pathway terkunci | `Terkunci` (tombol disabled) |
| `completed_lessons === 0` | `Mulai` |
| `0 < completed_lessons < total_lessons` | `Lanjutkan` |
| `completed_lessons === total_lessons` | `Ulangi` |

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

List undangan masuk & keluar milik user yang sedang login. Mendukung
pagination untuk scroll riwayat (terbaru paling atas, `created_at` desc).

**Query params (opsional)**

| Param | Default | Arti |
| --- | --- | --- |
| `limit` | `20` | Jumlah item per sisi (incoming/outgoing) |
| `offset` | `0` | Loncat N item terbaru |

**Response** `200`

```json
{
  "incoming": [
    {
      "id": 31,
      "from_user_id": 3,
      "from_username": "andi",
      "lesson_id": 5,
      "lesson_title": "Talking About Sports",
      "pathway_id": 1,
      "pathway_level": 1,
      "status": "pending",
      "created_at": "2026-09-16T10:00:00.000Z"
    }
  ],
  "outgoing": [
    {
      "id": 30,
      "to_user_id": 2,
      "to_username": "sari_21",
      "lesson_id": 5,
      "lesson_title": "Talking About Sports",
      "pathway_id": 1,
      "pathway_level": 1,
      "status": "pending",
      "created_at": "2026-09-16T09:00:00.000Z"
    }
  ],
  "meta": { "limit": 20, "offset": 0 }
}
```

> Field `pathway_id`/`pathway_level` dipakai dropdown level di form kirim
> undangan. Field `created_at` dipakai untuk urutan terbaru-paling-atas.
> `status`: `pending` | `accepted` | `rejected`.

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

### Invite realtime (status undangan masuk & terkirim)

Invite memakai **Socket.io penuh** supaya kedua sisi realtime — pengirim
maupun penerima tidak perlu refresh/polling. REST (`POST/PATCH/GET /api/invites`)
tetap ada sebagai fallback & untuk load awal, tapi semua perubahan status
di-broadcast lewat event di bawah.

**Join room saat halaman invite dibuka:**

```js
// Frontend kirim sekali setelah connect + login
socket.emit("invite:join", { userId: 2 });
// Server gabungkan socket ke:
//   - room "user:2" (user-room milik user ini)
//   - room "invite:pending:2" bila user 2 masih punya invite pending (masuk/keluar)
//     - room sementara ini dipakai untuk broadcast status pending
//     - server hapus room ini (leave) saat invite sudah tidak pending lagi
```

> Aturan room: `user:{id}` bersifat permanen selama socket connect
> (untuk event personal). `invite:pending:{id}` bersifat sementara —
> server menambahkan saat invite baru dibuat dan menghapus saat invite
> di-respond (diterima/ditolak), supaya broadcast pending tidak bocor ke
> user yang sudah tidak punya invite pending.

**Kirim undangan (tombol "Kirim Undangan" di card kirim undangan):**

```js
socket.emit("invite:send", { lesson_id: 5, to_username: "sari_21" });

// Server validasi (username ada, lesson unlocked), simpan invite status pending,
// lalu broadcast ke KEDUA sisi:
//   - ke penerima: room "user:{to_user_id}"
//   - ke pengirim: room "user:{from_user_id}"
//   - ke room "invite:pending:{to_user_id}" + "invite:pending:{from_user_id}"
//     (bila room pending-nya aktif) untuk update badge pending
socket.on("invite:new", (invite) => {
  // { id, lesson_id, lesson_title, pathway_id, pathway_level,
  //   from_user_id, from_username, to_user_id, to_username,
  //   status: "pending", created_at }
  // Frontend: prepend ke list yang sesuai (masuk/terkirim), terbaru paling atas,
  // tambah badge pending +1
});
```

**Terima undangan (tombol "Terima" di card undangan masuk):**

```js
socket.emit("invite:respond", { inviteId: 31, action: "accept" });

// Server: update invite jadi accepted, buat conversation baru,
// hapus room "invite:pending:{id}" bila user tsb sudah tidak punya pending lain,
// lalu broadcast ke KEDUA sisi (room user masing-masing):
socket.on("invite:status", (data) => {
  // { invite_id, status: "accepted", conversation_id: 101,
  //   lesson_id: 5, from_username: "andi", to_username: "budi99" }
  // Frontend pengirim: ubah badge pending -> diterima (+ conversation_id tersimpan)
  // Frontend penerima: tombol berubah -> "Masuk Room" (navigate /chat-room/101)
});
```

**Tolak undangan (tombol "Tolak" di card undangan masuk):**

```js
socket.emit("invite:respond", { inviteId: 31, action: "reject" });

// Server: update invite jadi rejected, hapus room pending bila sudah kosong,
// broadcast ke KEDUA sisi:
socket.on("invite:status", (data) => {
  // { invite_id, status: "rejected", lesson_id: 5,
  //   from_username: "andi", to_username: "budi99" }
  // Frontend kedua sisi: ubah badge pending -> ditolak
});
```

**Aturan tampilan list (berlaku untuk Undangan Masuk & Terkirim):**

- `pending` selalu dihitung dari invite berstatus pending yang belum di-respond
  (`badge "N pending"` = jumlah item pending saat ini).
- Item pending tampil menonjol di atas (highlight + tombol aksi); item yang
  sudah di-respond (accepted/rejected) tampil redup di bawahnya sebagai riwayat.
- Urutan: terbaru paling atas (`created_at` desc). List bisa di-scroll untuk
  melihat riwayat terdahulu.
- Event `invite:new` → prepend item + badge pending +1 (tanpa reload).
- Event `invite:status` → update item yang sama di KEDUA sisi
  (pending → diterima/ditolak) + badge pending −1 (tanpa reload).

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
