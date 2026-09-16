// Flag satu-kali-pakai: true hanya pada render pertama setelah logout().
// Guard halaman proteksi memakainya untuk melewatkan toast "Silakan masuk...".
// Modul kecil ini dipisah dari AuthProvider supaya tidak melanggar aturan
// react-refresh (file provider hanya boleh mengekspor komponen).
let justLoggedOut = false;

export function markJustLoggedOut() {
  justLoggedOut = true;
}

export function consumeJustLoggedOut() {
  const value = justLoggedOut;
  justLoggedOut = false;
  return value;
}
