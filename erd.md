# Anna-101 — Database ERD

```mermaid
erDiagram
  PATHWAYS ||--o{ LESSONS : contains
  LESSONS ||--o{ VOCABULARY_WORDS : introduces
  USERS ||--o{ USER_LESSON_PROGRESS : has
  LESSONS ||--o{ USER_LESSON_PROGRESS : tracked_in
  LESSONS ||--o{ CONVERSATION_INVITES : for
  USERS ||--o{ CONVERSATION_INVITES : sends
  USERS ||--o{ CONVERSATION_INVITES : receives
  CONVERSATION_INVITES ||--o| CONVERSATIONS : creates
  LESSONS ||--o{ CONVERSATIONS : practiced_in
  CONVERSATIONS ||--o{ CONVERSATION_PARTICIPANTS : has
  USERS ||--o{ CONVERSATION_PARTICIPANTS : joins
  CONVERSATIONS ||--o{ MESSAGES : contains
  USERS ||--o{ MESSAGES : sends
  CONVERSATIONS ||--o{ SESSION_EVALUATIONS : produces
  USERS ||--o{ SESSION_EVALUATIONS : receives

  PATHWAYS {
    int id PK
    string name
    int level
    string cefr_level
    int order
  }
  LESSONS {
    int id PK
    int pathway_id FK
    string title
    text topic_prompt
    int order
    int estimated_minutes
  }
  VOCABULARY_WORDS {
    int id PK
    int lesson_id FK
    string word
    string meaning
    string example_sentence
  }
  USERS {
    int id PK
    string name
    string username
    string email
    string password_hash
    int current_pathway_id
  }
  USER_LESSON_PROGRESS {
    int id PK
    int user_id FK
    int lesson_id FK
    string status
    int score
    datetime completed_at
  }
  CONVERSATION_INVITES {
    int id PK
    int lesson_id FK
    int from_user_id FK
    int to_user_id FK
    string status
    datetime created_at
    datetime responded_at
  }
  CONVERSATIONS {
    int id PK
    int lesson_id FK
    int invite_id FK
    string status
    %% status: demo (fase contoh Anna) | active | finished
    datetime started_at
    datetime ended_at
  }
  CONVERSATION_PARTICIPANTS {
    int id PK
    int conversation_id FK
    int user_id FK
    datetime joined_at
  }
  MESSAGES {
    int id PK
    int conversation_id FK
    int sender_id FK
    string sender_type
    string message_type
    text content
    datetime created_at
  }
  SESSION_EVALUATIONS {
    int id PK
    int conversation_id FK
    int user_id FK
    text strengths
    text evaluation
    int score
    datetime created_at
  }
```

## Catatan desain

- **`sender_type`** di `MESSAGES` bernilai `user` atau `ai`. Kalau `ai`, kolom `sender_id` bernilai `null`.
- **`message_type`** membedakan pesan: `chat` (percakapan normal antar user), `suggestion` (saran jawaban dari AI saat diminta), `system` (notifikasi seperti "Anna finish").
- **Demo percakapan pembuka** (contoh greeting yang digenerate AI di awal sesi) **tidak disimpan** ke tabel `MESSAGES` — sifatnya ephemeral, cukup dikirim ke frontend lewat socket.io dan dibuang setelah user membalas "Anna ready".
- **`CONVERSATION_INVITES`** punya dua relasi ke `USERS` (`from_user_id` dan `to_user_id`) — satu user mengundang user lain lewat username untuk berlatih bareng di satu `lesson`.
- **`SESSION_EVALUATIONS`** dibuat satu baris per partisipan per sesi, karena evaluasi AI di akhir sesi bisa beda untuk tiap user meski dalam room yang sama.
