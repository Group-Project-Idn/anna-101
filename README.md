# anna-101

Nice, ini kombinasi yang menarik — struktur kurikulum dari EnglishClass101, tapi cara belajarnya (delivery method) pakai chat AI kayak Gliglish. Jadi tiap lesson di pathway itu bukan video+quiz lagi, tapi jadi sesi chat sama AI yang temanya sesuai lesson itu.

Dari 2 gambar itu kelihatan strukturnya: Pathway (Level 1-4) → Lessons (urutan/journey) → progress tracking (lock/complete/score) + vocabulary count. Ini pemetaan entity-nya:

Core (6 entity)

pathways

id, name (Level 1 American English, dst), level (1-4), cefr_level, description, order

lessons

id, pathway_id, title (misal "Talking About Sports"), description, topic_prompt (system prompt buat ngarahin Gemini biar sesuai topik lesson itu), order, estimated_minutes

users

id, name, email, password_hash, current_pathway_id, created_at

user_lesson_progress — ini pengganti "Journey" checklist yang keliatan di gambar 1 (lock 🔒, ✅ complete, skor 5/5)

id, user_id, lesson_id, status (locked/unlocked/completed), score, completed_at

conversations — 1 lesson bisa dicoba berkali-kali, jadi tiap attempt = 1 row

id, user_id, lesson_id, started_at, ended_at

messages

id, conversation_id, role (user/ai), content, created_at
Opsional

vocabulary_words — kalau mau niru fitur "91 Words" di gambar 1

id, lesson_id, word, meaning, example_sentence

Assessment/quiz entity — di gambar 2 kelihatan ada "37 Assessments" terpisah dari lesson (kuis pilihan ganda). Tapi karena metode kamu diganti jadi chat-based, kemungkinan besar ini ga perlu dibikin lagi — soalnya penilaian pemahaman user bisa langsung dari hasil chat (AI yang nilai & kasih skor, disimpan di kolom score pada user_lesson_progress). Jadi quiz-nya "digantikan" sama percakapan itu sendiri.

Total: 6 entity wajib (kalau vocabulary dilewat dulu), atau 7 kalau mau nambah vocabulary list.

Ini lebih ringkas dari yang kamu kira ya — karena struktur kurikulumnya (pathway → lesson) itu simpel, dan yang bikin "berat" biasanya fitur kuis/video/dll udah digantikan sama chat AI-nya sendiri.

ERD-nya, 7 entity total (termasuk vocabulary_words yang opsional).

Beberapa poin relasi yang penting dicermati:

lessons punya kolom topic_prompt — ini yang bikin tiap lesson "beda arah" pas chat sama Gemini, isinya instruksi buat ngarahin AI biar tetap sesuai topik lesson itu (misal "Talking About Sports" → AI cuma boleh ngobrol seputar olahraga).
conversations nunjuk ke lesson_id — jadi kalau user ulang lesson yang sama beberapa kali, tiap attempt kesimpen sebagai conversations baru, tapi progressnya diringkas di user_lesson_progress (status + skor terbaik/terakhir).
messages cuma nyimpen isi chat aja, ga perlu tau soal lesson-nya karena udah kebawa dari conversations.

Kalau nanti mau drop vocabulary_words (karena scope tugas mepet waktu), tinggal hapus tabel itu doang — ga ada FK lain yang bergantung ke situ.

Ada beberapa opsi:

Suara → Teks (kamu ngomong, jadi teks)
Web Speech API (SpeechRecognition) — bawaan browser, gratis, ga perlu API key. Paling gampang buat mulai.
Whisper API (OpenAI) atau Gemini API sendiri (Gemini bisa terima input audio langsung, jadi ga perlu transkripsi manual dulu)
Teks → Suara (jawaban Gemini dibacain)
Web Speech API (SpeechSynthesis) — juga bawaan browser, gratis, tinggal speechSynthesis.speak()
ElevenLabs API — suaranya jauh lebih natural, tapi berbayar (ada free tier terbatas)
Google Cloud Text-to-Speech — kalau mau konsisten pakai ekosistem Google/Gemini
Rekomendasi buat scope tugas kamu

Paling simpel & gratis: pakai Web Speech API buat dua-duanya (SpeechRecognition buat rekam→teks, SpeechSynthesis buat teks→suara). Ga perlu install package npm apa-apa, langsung jalan di browser (Chrome paling stabil).

js
// Suara -> teks
const recognition = new webkitSpeechRecognition();
recognition.lang = 'en-US';
recognition.onresult = (e) => console.log(e.results[0][0].transcript);
recognition.start();

// Teks -> suara
const utterance = new SpeechSynthesisUtterance("Hello, how are you?");
speechSynthesis.speak(utterance);

Kalau nanti mau kualitas suara lebih bagus (lebih mirip manusia), baru upgrade ke ElevenLabs atau Google TTS — tapi buat MVP tugas, Web Speech API udah lebih dari cukup.
