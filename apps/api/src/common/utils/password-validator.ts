const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  'password1234',
  '12345678',
  '123456789',
  '1234567890',
  'qwertyui',
  'qwertyuiop',
  'letmein1',
  'welcome1',
  'admin123',
  'admin1234',
  'iloveyou',
  'monkey12',
  'dragon12',
  'master12',
]);

export function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  const normalized = password.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (COMMON_PASSWORDS.has(normalized) || COMMON_PASSWORDS.has(password.toLowerCase())) {
    return {
      isValid: false,
      message: 'Password is too common or easily guessable. Please choose a more secure password.',
    };
  }

  return { isValid: true };
}
