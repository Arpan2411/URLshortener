// src/utils/hash.js
const crypto = require('crypto');
const { promisify } = require('util');

const randomBytes = promisify(crypto.randomBytes);
const pbkdf2 = promisify(crypto.pbkdf2);

/**
 * Generate a hash using SHA-256
 * @param {string} data - Data to hash
 * @param {string} [salt] - Optional salt
 * @returns {string} Hash string
 */
const sha256 = (data, salt = '') => {
  const hash = crypto.createHash('sha256');
  hash.update(salt + data);
  return hash.digest('hex');
};

/**
 * Generate a hash using SHA-512
 * @param {string} data - Data to hash
 * @param {string} [salt] - Optional salt
 * @returns {string} Hash string
 */
const sha512 = (data, salt = '') => {
  const hash = crypto.createHash('sha512');
  hash.update(salt + data);
  return hash.digest('hex');
};

/**
 * Generate a hash using MD5 (not recommended for security)
 * @param {string} data - Data to hash
 * @returns {string} Hash string
 */
const md5 = (data) => {
  const hash = crypto.createHash('md5');
  hash.update(data);
  return hash.digest('hex');
};

/**
 * Generate a hash using HMAC-SHA256
 * @param {string} data - Data to hash
 * @param {string} secret - Secret key
 * @returns {string} HMAC hash string
 */
const hmacSha256 = (data, secret) => {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  return hmac.digest('hex');
};

/**
 * Generate a hash using HMAC-SHA512
 * @param {string} data - Data to hash
 * @param {string} secret - Secret key
 * @returns {string} HMAC hash string
 */
const hmacSha512 = (data, secret) => {
  const hmac = crypto.createHmac('sha512', secret);
  hmac.update(data);
  return hmac.digest('hex');
};

/**
 * Hash a URL to create a short code (alternative to nanoid)
 * @param {string} url - URL to hash
 * @param {number} [length=7] - Desired length of the short code
 * @returns {string} Short code
 */
const hashUrl = (url, length = 7) => {
  const hash = sha256(url);
  // Take first 'length' characters from the hash
  // and convert to Base62 for URL-friendly characters
  const base62Chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  
  // Use the hash to generate Base62 characters
  for (let i = 0; i < length; i++) {
    // Take 2 hex characters (1 byte) and convert to a number
    const byte = parseInt(hash.substring(i * 2, i * 2 + 2), 16);
    result += base62Chars[byte % 62];
  }
  
  return result;
};

/**
 * Hash a string with a salt (for passwords)
 * @param {string} password - Password to hash
 * @param {string} [salt] - Optional salt (generated if not provided)
 * @param {number} [iterations=10000] - Number of iterations
 * @param {number} [keylen=64] - Key length
 * @param {string} [digest='sha512'] - Hash algorithm
 * @returns {Promise<{hash: string, salt: string}>} Hash and salt
 */
const hashPassword = async (
  password,
  salt = null,
  iterations = 10000,
  keylen = 64,
  digest = 'sha512'
) => {
  // Generate salt if not provided
  if (!salt) {
    const saltBuffer = await randomBytes(16);
    salt = saltBuffer.toString('hex');
  }
  
  // Hash the password
  const hash = await pbkdf2(password, salt, iterations, keylen, digest);
  
  return {
    hash: hash.toString('hex'),
    salt,
    iterations,
    keylen,
    digest,
  };
};

/**
 * Verify a password against a hash
 * @param {string} password - Password to verify
 * @param {string} storedHash - Stored hash
 * @param {string} salt - Salt used for hashing
 * @param {number} [iterations=10000] - Number of iterations
 * @param {number} [keylen=64] - Key length
 * @param {string} [digest='sha512'] - Hash algorithm
 * @returns {Promise<boolean>} True if password matches
 */
const verifyPassword = async (
  password,
  storedHash,
  salt,
  iterations = 10000,
  keylen = 64,
  digest = 'sha512'
) => {
  const { hash } = await hashPassword(password, salt, iterations, keylen, digest);
  return hash === storedHash;
};

/**
 * Generate a random string (for tokens, API keys, etc.)
 * @param {number} [length=32] - Length of the random string
 * @param {string} [encoding='hex'] - Encoding (hex, base64, etc.)
 * @returns {Promise<string>} Random string
 */
const generateRandomString = async (length = 32, encoding = 'hex') => {
  const bytes = await randomBytes(length);
  return bytes.toString(encoding);
};

/**
 * Generate a UUID v4
 * @returns {string} UUID v4
 */
const generateUUID = () => {
  return crypto.randomUUID();
};

/**
 * Generate a secure token
 * @param {number} [length=32] - Length of the token
 * @returns {Promise<string>} Secure token
 */
const generateToken = async (length = 32) => {
  const bytes = await randomBytes(length);
  // Convert to URL-safe Base64
  return bytes
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Calculate the hash of a file buffer
 * @param {Buffer} buffer - File buffer
 * @param {string} [algorithm='sha256'] - Hash algorithm
 * @returns {string} File hash
 */
const hashFile = (buffer, algorithm = 'sha256') => {
  const hash = crypto.createHash(algorithm);
  hash.update(buffer);
  return hash.digest('hex');
};

/**
 * Create a checksum of an object
 * @param {Object} obj - Object to checksum
 * @param {string} [algorithm='sha256'] - Hash algorithm
 * @returns {string} Checksum
 */
const createChecksum = (obj, algorithm = 'sha256') => {
  const json = JSON.stringify(obj);
  return sha256(json, algorithm);
};

/**
 * Generate a short hash (for URLs, etc.)
 * @param {string} data - Data to hash
 * @param {number} [length=8] - Desired length
 * @param {string} [algorithm='sha256'] - Hash algorithm
 * @returns {string} Short hash
 */
const shortHash = (data, length = 8, algorithm = 'sha256') => {
  const hash = crypto.createHash(algorithm);
  hash.update(data);
  const digest = hash.digest('hex');
  return digest.substring(0, length);
};

/**
 * Hash an IP address (for privacy/security)
 * @param {string} ip - IP address
 * @param {string} [salt] - Optional salt
 * @returns {string} Hashed IP
 */
const hashIP = (ip, salt = '') => {
  return sha256(ip, salt);
};

/**
 * Compare two hashes in constant time (prevents timing attacks)
 * @param {string} hash1 - First hash
 * @param {string} hash2 - Second hash
 * @returns {boolean} True if hashes match
 */
const constantTimeCompare = (hash1, hash2) => {
  if (hash1.length !== hash2.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(hash1),
    Buffer.from(hash2)
  );
};

/**
 * Get available hash algorithms
 * @returns {string[]} List of available algorithms
 */
const getAvailableAlgorithms = () => {
  return crypto.getHashes();
};

module.exports = {
  sha256,
  sha512,
  md5,
  hmacSha256,
  hmacSha512,
  hashUrl,
  hashPassword,
  verifyPassword,
  generateRandomString,
  generateUUID,
  generateToken,
  hashFile,
  createChecksum,
  shortHash,
  hashIP,
  constantTimeCompare,
  getAvailableAlgorithms,
};