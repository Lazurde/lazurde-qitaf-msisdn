export type NormaliseError = 'empty' | 'invalid_format' | 'not_ksa_mobile';
export type NormaliseSuccess = {
    canonical: string;
};
export type NormaliseFailure = {
    error: NormaliseError;
};
export type NormaliseResult = NormaliseSuccess | NormaliseFailure;
/**
 * Normalise any KSA mobile number variant to canonical 9665XXXXXXXX (12 digits, no +).
 *
 * Accepted input variants:
 *   +966 5XX XXX XXX  |  00966 5XX XXX XXX  |  966 5XX XXX XXX
 *   05XX XXX XXX      |  5XX XXX XXX
 *   With spaces, dashes, parentheses, Arabic-Indic digits, copy-paste whitespace.
 *
 * Returns { error: 'empty' }          — blank / whitespace only input
 *         { error: 'invalid_format' } — digits present but not a valid KSA pattern
 *         { error: 'not_ksa_mobile' } — valid length but subscriber number ≠ 5XXXXXXXX
 *         { canonical: '9665XXXXXXXX' } — success
 */
export declare function normalizeKsaMsisdn(input: string): NormaliseResult;
/**
 * Mask a canonical MSISDN for logging and CS display.
 * Input:  9665XXXXXXXX (12 digits)
 * Output: 966 5XX XXX X{last2}
 */
export declare function maskMsisdn(canonical: string): string;
/**
 * Convenience: returns true if input normalises successfully.
 */
export declare function isValidKsaMsisdn(input: string): boolean;
