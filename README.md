# Anna-101

Web belajar bahasa Inggris yang menggabungkan **kurikulum EnglishClass101** (pathway Level 1-4 American English) dengan **metode latihan percakapan berbasis AI ala Gliglish** — bedanya, di sini latihan dilakukan **berdua** (2 user) dengan AI ("Anna") berperan sebagai guru/asisten yang membimbing di dalam room chat yang sama.

## Konsep Utama

Materi (silabus, urutan lesson, level) tetap mengikuti struktur EnglishClass101. Yang berubah adalah **cara belajarnya**: bukan video + kuis pilihan ganda, tapi sesi chat real-time antara 2 orang yang dipandu AI.

## Alur Penggunaan

1. **Login/Register** — user daftar dengan `username` unik.
2. **Pilih Pathway & Lesson** — user browse lesson sesuai level (Level 1-4), lesson terkunci berurutan sampai lesson sebelumnya selesai.
3. **Undang partner** — user memasukkan `username` teman untuk diajak latihan bersama di 1 lesson.
4. **Terima undangan** — partner menerima, sistem otomatis membuka room chat (`conversation`).
5. **Demo percakapan** — Anna (AI) menghasilkan contoh dialog untuk topik lesson tersebut (minimal 10 kalimat per orang), ditampilkan sebagai referensi. Bersifat sementara — begitu kedua user membalas **"Anna ready"**, demo dihapus dari layar.
6. **Latihan chat asli** — kedua user saling chat langsung sesuai topik lesson.
7. **Minta saran** — kapan pun selama chat, user bisa ketik **"Anna, minta saran jawaban"**, dan Anna akan menyarankan kalimat balasan yang bisa langsung dipakai/disesuaikan.
8. **Selesai sesi** — user ketik **"Anna finish"** untuk mengakhiri sesi.
9. **Evaluasi** — Anna menghasilkan ringkasan kelebihan & evaluasi terpisah untuk masing-masing user berdasarkan performa mereka di sesi tersebut.

## Fitur

- Autentikasi (register/login) berbasis JWT
- Pathway & lesson mengikuti struktur EnglishClass101 (Level 1-4)
- Sistem undangan partner belajar (by username)
- Chat real-time 2 user + AI menggunakan Socket.io
- AI teacher (Gemini API) untuk: generate demo dialog, memberi saran jawaban di tengah chat, dan evaluasi akhir sesi
- Tracking progress per user per lesson

## Tech Stack (usulan)

| Layer     | Teknologi          |
| --------- | ------------------ |
| Backend   | Node.js + Express  |
| Real-time | Socket.io          |
| Database  | PostgreSQL / MySQL |
| AI        | Google Gemini API  |
| Frontend  | React / Next.js    |
| Auth      | JWT                |

## Dokumentasi Terkait

- [`ERD.md`](./ERD.md) — struktur database & relasi antar entity
- [`api-contract.md`](./api-contract.md) — kontrak endpoint REST & event Socket.io antara frontend-backend

## Status Proyek

🚧 Tahap perancangan (database & API contract) — implementasi belum dimulai.
