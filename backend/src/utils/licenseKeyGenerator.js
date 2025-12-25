/**
 * License Key Generator & Validator
 * 
 * Generates and validates license keys with the following format:
 * YYYY-XXXX-XXXX-XXXX (4 segments separated by dashes)
 * 
 * Features:
 * - Checksum validation
 * - Tamper detection
 * - Offline validation support
 * - Multiple license types support
 */

const crypto = require('crypto');

class LicenseKeyGenerator {
  // License type configurations
  static LICENSE_TYPES = {
    STARTER: 'STARTER',
    PROFESSIONAL: 'PROFESSIONAL',
    ENTERPRISE: 'ENTERPRISE',
    ADDON: 'ADDON'
  };

  // Checksum algorithm seed (change this to your secret)
  static CHECKSUM_SECRET = process.env.LICENSE_SECRET || 'your-secret-key-change-this';

  /**
   * Generate a valid license key
   * 
   * @param {Object} options - License generation options
   * @param {string} options.type - License type (STARTER, PROFESSIONAL, ENTERPRISE)
   * @param {string} options.customerId - Customer UUID
   * @param {Date} options.expiryDate - License expiry date
   * @param {Object} options.metadata - Additional metadata (stores limit, users limit, etc.)
   * @returns {string} - Generated license key
   * 
   * @example
   * const key = LicenseKeyGenerator.generate({
   *   type: 'STARTER',
   *   customerId: 'uuid-here',
   *   expiryDate: new Date('2025-12-31'),
   *   metadata: { storesLimit: 1, usersLimit: 5 }
   * });
   */
  static generate(options) {
    const {
      type = 'STARTER',
      customerId,
      expiryDate,
      metadata = {}
    } = options;

    // Validate inputs
    if (!customerId) {
      throw new Error('customerId is required');
    }
    if (!expiryDate) {
      throw new Error('expiryDate is required');
    }

    // Generate unique ID (first segment) - use timestamp
    const timestamp = Date.now();
    const segment1 = this._generateSegment1(timestamp);

    // Generate customer hash (second segment)
    const segment2 = this._generateSegment2(customerId, type);

    // Generate metadata hash (third segment)
    const segment3 = this._generateSegment3(expiryDate, metadata);

    // Generate checksum (fourth segment)
    const checksum = this._generateChecksum(segment1, segment2, segment3);

    // Format: YYYY-XXXX-XXXX-XXXX
    const licenseKey = `${segment1}-${segment2}-${segment3}-${checksum}`;

    return licenseKey;
  }

  /**
   * Validate a license key
   * 
   * @param {string} licenseKey - License key to validate
   * @returns {Object} - { isValid: boolean, data: object, error: string }
   */
  static validate(licenseKey) {
    try {
      // Check format
      if (!this._validateFormat(licenseKey)) {
        return {
          isValid: false,
          data: null,
          error: 'Invalid license key format'
        };
      }

      // Split key into segments
      const segments = licenseKey.split('-');
      const [segment1, segment2, segment3, providedChecksum] = segments;

      // Verify checksum
      const calculatedChecksum = this._generateChecksum(segment1, segment2, segment3);
      if (providedChecksum !== calculatedChecksum) {
        return {
          isValid: false,
          data: null,
          error: 'License key checksum validation failed - key may be tampered'
        };
      }

      // Decode and validate data
      const data = this._decodeSegments(segment1, segment2, segment3);

      return {
        isValid: true,
        data: data,
        error: null
      };
    } catch (error) {
      return {
        isValid: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Check if license is expired
   * 
   * @param {string} licenseKey - License key
   * @returns {boolean} - true if expired, false otherwise
   */
  static isExpired(licenseKey) {
    const validation = this.validate(licenseKey);
    if (!validation.isValid) return true;

    const expiryDate = new Date(validation.data.expiryDate);
    return expiryDate < new Date();
  }

  /**
   * Get remaining days until expiry
   * 
   * @param {string} licenseKey - License key
   * @returns {number} - Days remaining (negative if expired)
   */
  static getDaysRemaining(licenseKey) {
    const validation = this.validate(licenseKey);
    if (!validation.isValid) return -1;

    const expiryDate = new Date(validation.data.expiryDate);
    const today = new Date();
    const daysMs = expiryDate - today;
    return Math.ceil(daysMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Extract metadata from license key (offline)
   * Does NOT validate checksum - use validate() for that
   * 
   * @param {string} licenseKey - License key
   * @returns {Object} - Metadata object
   */
  static extractMetadata(licenseKey) {
    try {
      const segments = licenseKey.split('-');
      if (segments.length !== 4) return null;

      const [segment1, segment2, segment3] = segments;
      return this._decodeSegments(segment1, segment2, segment3);
    } catch (error) {
      return null;
    }
  }

  // ============= PRIVATE METHODS =============

  /**
   * Generate first segment (timestamp-based)
   * @private
   */
  static _generateSegment1(timestamp) {
    const year = new Date(timestamp).getFullYear().toString().slice(-2);
    const random = this._randomHex(2);
    return `${year}${random}`.toUpperCase();
  }

  /**
   * Generate second segment (customer hash-based)
   * @private
   */
  static _generateSegment2(customerId, type) {
    const typeCode = type.substring(0, 2).toUpperCase();
    const hash = crypto
      .createHash('sha256')
      .update(`${customerId}${typeCode}${this.CHECKSUM_SECRET}`)
      .digest('hex')
      .substring(0, 2)
      .toUpperCase();
    
    return `${typeCode}${hash}`;
  }

  /**
   * Generate third segment (expiry + metadata hash)
   * @private
   */
  static _generateSegment3(expiryDate, metadata) {
    const expiry = new Date(expiryDate);
    const expiryStr = `${expiry.getFullYear()}${String(expiry.getMonth() + 1).padStart(2, '0')}`;
    
    const metaStr = JSON.stringify(metadata);
    const hash = crypto
      .createHash('sha256')
      .update(`${expiryStr}${metaStr}${this.CHECKSUM_SECRET}`)
      .digest('hex')
      .substring(0, 2)
      .toUpperCase();

    return `${expiryStr}${hash}`;
  }

  /**
   * Generate checksum for all segments
   * @private
   */
  static _generateChecksum(segment1, segment2, segment3) {
    const combined = `${segment1}${segment2}${segment3}${this.CHECKSUM_SECRET}`;
    const hash = crypto
      .createHash('sha256')
      .update(combined)
      .digest('hex')
      .substring(0, 4)
      .toUpperCase();

    return hash;
  }

  /**
   * Validate license key format
   * @private
   */
  static _validateFormat(licenseKey) {
    if (typeof licenseKey !== 'string') return false;
    
    // Format: YYYY-XXXX-XXXX-XXXX
    const regex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return regex.test(licenseKey);
  }

  /**
   * Decode segments to extract metadata
   * @private
   */
  static _decodeSegments(segment1, segment2, segment3) {
    // Extract type from segment2
    const type = segment2.substring(0, 2) === 'ST' ? 'STARTER'
                : segment2.substring(0, 2) === 'PR' ? 'PROFESSIONAL'
                : segment2.substring(0, 2) === 'EN' ? 'ENTERPRISE'
                : 'ADDON';

    // Extract expiry from segment3
    const yearMonth = segment3.substring(0, 6);
    const year = parseInt(yearMonth.substring(0, 4));
    const month = parseInt(yearMonth.substring(4, 6));
    const expiryDate = new Date(year, month - 1, 28); // Last day of month

    return {
      type: type,
      expiryDate: expiryDate.toISOString().split('T')[0],
      segment1: segment1,
      segment2: segment2,
      segment3: segment3,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate random hex string
   * @private
   */
  static _randomHex(length) {
    return crypto
      .randomBytes(length)
      .toString('hex')
      .substring(0, length)
      .toUpperCase();
  }
}

module.exports = LicenseKeyGenerator;
