// scripts/test-rate-limit.js
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_URL = 'https://example.com';

async function testRateLimiting() {
  console.log('🚀 Testing Rate Limiting...\n');

  // Test 1: Check rate limit status
  console.log('📊 Getting rate limit status...');
  try {
    const statusRes = await axios.get(`${BASE_URL}/api/rate-limit/status`);
    console.log('Rate Limit Status:', JSON.stringify(statusRes.data, null, 2));
  } catch (error) {
    console.log('❌ Failed to get status:', error.message);
  }

  console.log('\n📝 Sending 105 requests to test rate limiting...');
  
  const start = Date.now();
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 1; i <= 105; i++) {
    try {
      const response = await axios.post(`${BASE_URL}/api/urls/shorten`, {
        originalUrl: `${TEST_URL}?t=${i}`
      });
      
      successCount++;
      console.log(`✅ Request ${i}: Success (${response.status})`);
      
      // Show rate limit headers
      if (response.headers['x-ratelimit-remaining']) {
        console.log(`   Remaining: ${response.headers['x-ratelimit-remaining']}`);
      }
      
    } catch (error) {
      failCount++;
      if (error.response && error.response.status === 429) {
        console.log(`❌ Request ${i}: Rate Limited (429)`);
        console.log(`   Retry After: ${error.response.headers['retry-after'] || 'N/A'}s`);
        console.log(`   Message: ${error.response.data.message}`);
      } else {
        console.log(`❌ Request ${i}: Failed (${error.message})`);
      }
    }
    
    // Small delay to not flood
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const duration = (Date.now() - start) / 1000;
  
  console.log('\n📊 Rate Limit Test Results:');
  console.log(`   ✅ Successful requests: ${successCount}`);
  console.log(`   ❌ Failed requests: ${failCount}`);
  console.log(`   ⏱️  Duration: ${duration}s`);
  
  // Test 2: Get rate limit analytics
  console.log('\n📊 Getting rate limit analytics...');
  try {
    const analyticsRes = await axios.get(`${BASE_URL}/api/rate-limit/analytics`);
    console.log('Analytics:', JSON.stringify(analyticsRes.data, null, 2));
  } catch (error) {
    console.log('❌ Failed to get analytics:', error.message);
  }

  // Test 3: Get alerts
  console.log('\n🔔 Getting rate limit alerts...');
  try {
    const alertsRes = await axios.get(`${BASE_URL}/api/rate-limit/alerts`);
    console.log('Alerts:', JSON.stringify(alertsRes.data, null, 2));
  } catch (error) {
    console.log('❌ Failed to get alerts:', error.message);
  }
}

// Run the test
testRateLimiting().catch(console.error);