// src/tests/performance/cache-test.js
const axios = require('axios');
const { performance } = require('perf_hooks');

const BASE_URL = 'http://localhost:3000';
const TEST_URL = 'https://example.com';

async function testPerformance() {
  console.log('🚀 Testing cache performance...\n');

  // Test 1: First request (cache miss)
  console.log('📊 First request (Cache Miss):');
  const start1 = performance.now();
  await axios.post(`${BASE_URL}/api/urls/shorten`, { originalUrl: TEST_URL });
  const end1 = performance.now();
  console.log(`⏱️  Time: ${(end1 - start1).toFixed(2)}ms\n`);

  // Test 2: Second request (cache hit)
  console.log('📊 Second request (Cache Hit):');
  const start2 = performance.now();
  await axios.post(`${BASE_URL}/api/urls/shorten`, { originalUrl: TEST_URL });
  const end2 = performance.now();
  console.log(`⏱️  Time: ${(end2 - start2).toFixed(2)}ms\n`);

  // Test 3: Multiple concurrent requests
  console.log('📊 Concurrent requests (10):');
  const start3 = performance.now();
  const promises = Array(10).fill().map(() => 
    axios.post(`${BASE_URL}/api/urls/shorten`, { originalUrl: TEST_URL })
  );
  await Promise.all(promises);
  const end3 = performance.now();
  console.log(`⏱️  Total time: ${(end3 - start3).toFixed(2)}ms`);
  console.log(`⏱️  Average: ${((end3 - start3) / 10).toFixed(2)}ms\n`);

  // Test 4: Redirect performance
  console.log('📊 Redirect performance:');
  const response = await axios.post(`${BASE_URL}/api/urls/shorten`, { originalUrl: TEST_URL });
  const shortCode = response.data.data.shortCode;
  
  const start4 = performance.now();
  await axios.get(`${BASE_URL}/api/urls/${shortCode}`, { maxRedirects: 0 });
  const end4 = performance.now();
  console.log(`⏱️  Redirect time: ${(end4 - start4).toFixed(2)}ms`);
}

testPerformance().catch(console.error);