export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  return /^[0-9+\-\s()]{9,15}$/.test(phone.trim());
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

export function isValidName(name: string): boolean {
  return name.trim().length >= 2;
}
