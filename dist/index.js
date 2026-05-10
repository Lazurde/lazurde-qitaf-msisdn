"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeKsaMsisdn = normalizeKsaMsisdn;
exports.maskMsisdn = maskMsisdn;
exports.isValidKsaMsisdn = isValidKsaMsisdn;
// Arabic-Indic digit map (٠١٢٣٤٥٦٧٨٩ → 0-9)
const ARABIC_INDIC = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};
function replaceArabicIndic(s) {
    return s.replace(/[٠-٩]/g, (d) => ARABIC_INDIC[d] ?? d);
}
function stripToDigits(s) {
    // Replace Arabic-Indic, then keep only ASCII digits
    return replaceArabicIndic(s).replace(/[^\d]/g, '');
}
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
function normalizeKsaMsisdn(input) {
    if (!input || !input.trim())
        return { error: 'empty' };
    const raw = input.trim();
    // Handle leading + before stripping all non-digits
    const hasPlus = raw.startsWith('+');
    const digits = stripToDigits(raw);
    if (!digits)
        return { error: 'empty' };
    let subscriber;
    if (hasPlus || digits.startsWith('00966') || digits.startsWith('966')) {
        // +966XXXXXXXXX or 966XXXXXXXXX or 00966XXXXXXXXX
        const stripped = digits.startsWith('00966')
            ? digits.slice(5)
            : digits.startsWith('966')
                ? digits.slice(3)
                : digits;
        subscriber = stripped;
    }
    else if (digits.startsWith('0')) {
        // 05XXXXXXXXX — local format with leading zero
        subscriber = digits.slice(1);
    }
    else {
        // 5XXXXXXXXX — bare subscriber number
        subscriber = digits;
    }
    if (subscriber.length !== 9)
        return { error: 'invalid_format' };
    if (!/^5[0-9]{8}$/.test(subscriber))
        return { error: 'not_ksa_mobile' };
    return { canonical: `966${subscriber}` };
}
/**
 * Mask a canonical MSISDN for logging and CS display.
 * Input:  9665XXXXXXXX (12 digits)
 * Output: 966 5XX XXX X{last2}
 */
function maskMsisdn(canonical) {
    if (!canonical || canonical.length !== 12)
        return '966XXXXXXXXX';
    const last2 = canonical.slice(-2);
    return `966 5XX XXX X${last2}`;
}
/**
 * Convenience: returns true if input normalises successfully.
 */
function isValidKsaMsisdn(input) {
    return 'canonical' in normalizeKsaMsisdn(input);
}
