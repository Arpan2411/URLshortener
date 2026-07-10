// src/tests/unit/url.service.test.js
const urlService = require('../../services/url.service');
const urlRepository = require('../../repositories/url.repository');

// Mock the repository
jest.mock('../../repositories/url.repository');

describe('URL Service - Phase 1 Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a new short URL when URL does not exist', async () => {
    const originalUrl = 'https://example.com';
    const mockShortCode = 'abc1234';
    
    // Mock repository responses
    urlRepository.findByOriginalUrl.mockResolvedValue(null);
    urlRepository.exists.mockResolvedValue(false);
    urlRepository.create.mockResolvedValue({
      shortCode: mockShortCode,
      originalUrl,
      clicks: 0,
    });

    const result = await urlService.createShortUrl(originalUrl);
    
    expect(result).toHaveProperty('shortCode', mockShortCode);
    expect(result).toHaveProperty('isExisting', false);
    expect(urlRepository.create).toHaveBeenCalled();
  });

  test('should return existing short URL when URL already exists', async () => {
    const originalUrl = 'https://example.com';
    const existingShortCode = 'xyz7890';
    
    urlRepository.findByOriginalUrl.mockResolvedValue({
      shortCode: existingShortCode,
      originalUrl,
      clicks: 5,
    });

    const result = await urlService.createShortUrl(originalUrl);
    
    expect(result).toHaveProperty('shortCode', existingShortCode);
    expect(result).toHaveProperty('isExisting', true);
    expect(result).toHaveProperty('clicks', 5);
    expect(urlRepository.create).not.toHaveBeenCalled();
  });

  test('should generate unique short code', () => {
    const code1 = urlService.generateShortCode();
    const code2 = urlService.generateShortCode();
    
    expect(code1).toHaveLength(7);
    expect(code2).toHaveLength(7);
    expect(code1).not.toBe(code2);
  });

  test('should validate URL correctly', () => {
    expect(urlService.isValidUrl('https://example.com')).toBe(true);
    expect(urlService.isValidUrl('http://example.com')).toBe(true);
    expect(urlService.isValidUrl('ftp://example.com')).toBe(false);
    expect(urlService.isValidUrl('not-a-url')).toBe(false);
  });

  test('should normalize URL correctly', () => {
    const url1 = 'https://Example.com/path/';
    const url2 = 'https://example.com/path';
    expect(urlService.normalizeUrl(url1)).toBe(url2);
  });
});