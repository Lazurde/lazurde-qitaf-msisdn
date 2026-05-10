import { normalizeKsaMsisdn, maskMsisdn, isValidKsaMsisdn } from '../index';

// ─── Happy path — all accepted input variants ────────────────────────────────

describe('normalizeKsaMsisdn — valid inputs', () => {
  const cases: [string, string][] = [
    // International with +
    ['+966512345678',  '966512345678'],
    ['+966 512345678', '966512345678'],
    ['+966 51 234 5678', '966512345678'],
    ['+966-512-345-678', '966512345678'],
    ['+966 (51) 234-5678', '966512345678'],

    // International without +
    ['966512345678',   '966512345678'],
    ['966 512 345 678', '966512345678'],

    // 00966 prefix
    ['00966512345678', '966512345678'],
    ['00966 51 234 5678', '966512345678'],

    // Local 05XX format
    ['0512345678',    '966512345678'],
    ['051 234 5678',  '966512345678'],
    ['051-234-5678',  '966512345678'],
    ['(051) 234-5678', '966512345678'],

    // Bare 9-digit subscriber
    ['512345678',     '966512345678'],
    ['51 234 5678',   '966512345678'],

    // Copy-paste whitespace (tabs, non-breaking spaces)
    ['+966\t512345678', '966512345678'],
    ['+966 512345678', '966512345678'],

    // Arabic-Indic digits
    ['+٩٦٦٥١٢٣٤٥٦٧٨', '966512345678'],
    ['٠٥١٢٣٤٥٦٧٨', '966512345678'],
    ['٥١٢٣٤٥٦٧٨', '966512345678'],

    // Mixed Arabic-Indic and ASCII
    ['+966 5١٢٣٤٥٦٧٨', '966512345678'],

    // Other valid KSA prefixes (55, 56, 58, 59, 50, 53, 54)
    ['+966551234567', '966551234567'],
    ['+966581234567', '966581234567'],
    ['0501234567',    '966501234567'],
  ];

  test.each(cases)('normalises "%s" → "%s"', (input, expected) => {
    const result = normalizeKsaMsisdn(input);
    expect(result).toEqual({ canonical: expected });
  });
});

// ─── Empty input ─────────────────────────────────────────────────────────────

describe('normalizeKsaMsisdn — empty inputs', () => {
  test('empty string', () => {
    expect(normalizeKsaMsisdn('')).toEqual({ error: 'empty' });
  });

  test('whitespace only', () => {
    expect(normalizeKsaMsisdn('   ')).toEqual({ error: 'empty' });
  });

  test('emoji only', () => {
    expect(normalizeKsaMsisdn('📱🔢')).toEqual({ error: 'empty' });
  });

  test('special characters only', () => {
    expect(normalizeKsaMsisdn('---()---')).toEqual({ error: 'empty' });
  });
});

// ─── Invalid format (digits present but wrong length/structure) ───────────────

describe('normalizeKsaMsisdn — invalid_format', () => {
  test('too short — 8 subscriber digits', () => {
    expect(normalizeKsaMsisdn('+966 51234567')).toEqual({ error: 'invalid_format' });
  });

  test('too long — 10 subscriber digits', () => {
    expect(normalizeKsaMsisdn('+966 5123456789')).toEqual({ error: 'invalid_format' });
  });

  test('local format too short', () => {
    expect(normalizeKsaMsisdn('051234567')).toEqual({ error: 'invalid_format' });
  });

  test('emoji contamination with partial number', () => {
    expect(normalizeKsaMsisdn('+966📱512345')).toEqual({ error: 'invalid_format' });
  });

  test('bare digits wrong length', () => {
    expect(normalizeKsaMsisdn('12345')).toEqual({ error: 'invalid_format' });
  });
});

// ─── Not a KSA mobile number ──────────────────────────────────────────────────

describe('normalizeKsaMsisdn — not_ksa_mobile', () => {
  test('KSA landline starting with 1', () => {
    expect(normalizeKsaMsisdn('+966112345678')).toEqual({ error: 'not_ksa_mobile' });
  });

  test('subscriber starts with 4 (not KSA mobile)', () => {
    expect(normalizeKsaMsisdn('+966412345678')).toEqual({ error: 'not_ksa_mobile' });
  });

  test('local format starting with 04 (landline)', () => {
    expect(normalizeKsaMsisdn('0412345678')).toEqual({ error: 'not_ksa_mobile' });
  });

  test('bare subscriber not starting with 5', () => {
    expect(normalizeKsaMsisdn('712345678')).toEqual({ error: 'not_ksa_mobile' });
  });
});

// ─── maskMsisdn ──────────────────────────────────────────────────────────────

describe('maskMsisdn', () => {
  test('masks middle digits, shows last 2', () => {
    expect(maskMsisdn('966512345678')).toBe('966 5XX XXX X78');
  });

  test('different last 2 digits', () => {
    expect(maskMsisdn('966501234567')).toBe('966 5XX XXX X67');
  });

  test('invalid input — wrong length returns fallback', () => {
    expect(maskMsisdn('')).toBe('966XXXXXXXXX');
    expect(maskMsisdn('123')).toBe('966XXXXXXXXX');
  });
});

// ─── isValidKsaMsisdn convenience wrapper ────────────────────────────────────

describe('isValidKsaMsisdn', () => {
  test('returns true for valid number', () => {
    expect(isValidKsaMsisdn('+966512345678')).toBe(true);
  });

  test('returns false for empty', () => {
    expect(isValidKsaMsisdn('')).toBe(false);
  });

  test('returns false for landline', () => {
    expect(isValidKsaMsisdn('+966112345678')).toBe(false);
  });
});

// ─── Round-trip: normalise then mask ─────────────────────────────────────────

describe('round-trip normalise → mask', () => {
  test('Arabic-Indic input produces correct mask', () => {
    const result = normalizeKsaMsisdn('٠٥١٢٣٤٥٦٧٨');
    expect('canonical' in result).toBe(true);
    if ('canonical' in result) {
      expect(maskMsisdn(result.canonical)).toBe('966 5XX XXX X78');
    }
  });

  test('+966 format input produces correct mask', () => {
    const result = normalizeKsaMsisdn('+966 51 234 5678');
    expect('canonical' in result).toBe(true);
    if ('canonical' in result) {
      expect(maskMsisdn(result.canonical)).toBe('966 5XX XXX X78');
    }
  });
});
