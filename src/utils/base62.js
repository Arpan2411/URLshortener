// src/utils/base62.js
/**
 * Base62 encoding/decoding utilities for URL shortening
 * Uses characters: 0-9, A-Z, a-z (62 characters total)
 */

const BASE62_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE = 62;

/**
 * Encode a number to Base62 string
 * @param {number} num - The number to encode
 * @returns {string} Base62 encoded string
 */
const encode = (num) => {
  if (num === 0) return BASE62_CHARSET[0];
  
  let encoded = '';
  let n = num;
  
  while (n > 0) {
    const remainder = n % BASE;
    encoded = BASE62_CHARSET[remainder] + encoded;
    n = Math.floor(n / BASE);
  }
  
  return encoded;
};

/**
 * Decode a Base62 string to number
 * @param {string} str - Base62 encoded string
 * @returns {number} Decoded number
 */
const decode = (str) => {
  let decoded = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const value = BASE62_CHARSET.indexOf(char);
    if (value === -1) {
      throw new Error(`Invalid Base62 character: ${char}`);
    }
    decoded = decoded * BASE + value;
  }
  
  return decoded;
};

/**
 * Generate a random Base62 string of specified length
 * @param {number} length - Length of the string (default: 7)
 * @returns {string} Random Base62 string
 */
const generateRandom = (length = 7) => {
  let result = '';
  const charsetLength = BASE62_CHARSET.length;
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charsetLength);
    result += BASE62_CHARSET[randomIndex];
  }
  
  return result;
};

/**
 * Check if a string is valid Base62
 * @param {string} str - String to validate
 * @returns {boolean} True if valid Base62
 */
const isValid = (str) => {
  if (!str || typeof str !== 'string') return false;
  
  for (const char of str) {
    if (BASE62_CHARSET.indexOf(char) === -1) {
      return false;
    }
  }
  
  return true;
};

/**
 * Convert a string ID to Base62 (useful for MongoDB ObjectId)
 * @param {string} id - MongoDB ObjectId or numeric string
 * @returns {string} Base62 encoded string
 */
const encodeId = (id) => {
  if (!id) return null;
  
  // If it's a MongoDB ObjectId, convert hex to decimal
  if (typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
    const num = BigInt('0x' + id);
    return encodeBigInt(num);
  }
  
  // If it's a number or numeric string
  const num = typeof id === 'number' ? id : parseInt(id, 10);
  if (isNaN(num)) return null;
  
  return encode(num);
};

/**
 * Encode a BigInt to Base62
 * @param {bigint} num - BigInt to encode
 * @returns {string} Base62 encoded string
 */
const encodeBigInt = (num) => {
  if (num === 0n) return BASE62_CHARSET[0];
  
  let encoded = '';
  let n = num;
  const bigBase = BigInt(BASE);
  
  while (n > 0n) {
    const remainder = Number(n % bigBase);
    encoded = BASE62_CHARSET[remainder] + encoded;
    n = n / bigBase;
  }
  
  return encoded;
};

/**
 * Decode a Base62 string to BigInt
 * @param {string} str - Base62 encoded string
 * @returns {bigint} Decoded BigInt
 */
const decodeBigInt = (str) => {
  let decoded = 0n;
  const bigBase = BigInt(BASE);
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const value = BASE62_CHARSET.indexOf(char);
    if (value === -1) {
      throw new Error(`Invalid Base62 character: ${char}`);
    }
    decoded = decoded * bigBase + BigInt(value);
  }
  
  return decoded;
};

/**
 * Get the Base62 character set
 * @returns {string} Base62 character set
 */
const getCharset = () => BASE62_CHARSET;

/**
 * Get the Base (62)
 * @returns {number} Base number
 */
const getBase = () => BASE;

module.exports = {
  encode,
  decode,
  generateRandom,
  isValid,
  encodeId,
  encodeBigInt,
  decodeBigInt,
  getCharset,
  getBase,
  BASE62_CHARSET,
  BASE,
};