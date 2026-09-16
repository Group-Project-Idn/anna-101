const USERNAME_PATTERN = /^[a-z0-9_]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegisterForm({ name, username, email, password }) {
  const errors = {};
  const cleanName = name.trim();
  const cleanUsername = username.trim();
  const cleanEmail = email.trim();

  if (!cleanName) {
    errors.name = "Nama wajib diisi.";
  } else if (cleanName.length < 2) {
    errors.name = "Nama minimal 2 karakter.";
  }

  if (!cleanUsername) {
    errors.username = "Username wajib diisi.";
  } else if (cleanUsername.length < 3) {
    errors.username = "Username minimal 3 karakter.";
  } else if (cleanUsername.length > 20) {
    errors.username = "Username maksimal 20 karakter.";
  } else if (!USERNAME_PATTERN.test(cleanUsername)) {
    errors.username = "Pakai huruf kecil, angka, atau underscore saja.";
  }

  if (!cleanEmail) {
    errors.email = "Email wajib diisi.";
  } else if (!EMAIL_PATTERN.test(cleanEmail)) {
    errors.email = "Format email belum benar.";
  }

  if (!password) {
    errors.password = "Password wajib diisi.";
  } else if (password.length < 6) {
    errors.password = "Password minimal 6 karakter.";
  }

  return errors;
}
