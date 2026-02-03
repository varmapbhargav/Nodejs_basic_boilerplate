import DOMPurify from 'isomorphic-dompurify';

export class Sanitizer {
  /**
   * Sanitize string input to prevent XSS
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }
    // Remove potentially dangerous characters while allowing safe content
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .trim();
  }

  /**
   * Sanitize HTML content
   */
  static sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'] });
  }

  /**
   * Sanitize email
   */
  static sanitizeEmail(email: string): string {
    return this.sanitizeString(email).toLowerCase();
  }

  /**
   * Sanitize object recursively
   */
  static sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = { ...obj };

    for (const key in sanitized) {
      const value = sanitized[key];

      if (typeof value === 'string') {
        (sanitized as any)[key] = this.sanitizeString(value);
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        (sanitized as any)[key] = this.sanitizeObject(value);
      } else if (Array.isArray(value)) {
        (sanitized as any)[key] = value.map((item: any) =>
          typeof item === 'string' ? this.sanitizeString(item) : item
        );
      }
    }

    return sanitized;
  }

  /**
   * Check if string contains suspicious patterns
   */
  static isSuspicious(input: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers like onclick=
      /eval\(/i,
      /expression\(/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(input));
  }
}
