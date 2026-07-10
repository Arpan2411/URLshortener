// scripts/test-utils.js
const base62 = require('../src/utils/base62');
const hash = require('../src/utils/hash');

console.log('🧪 Testing Utilities\n');

// Test Base62
console.log('📐 Testing Base62...');
const testNum = 123456789;
const encoded = base62.encode(testNum);
const decoded = base62.decode(encoded);
console.log(`  ${testNum} -> ${encoded} -> ${decoded}`);
console.log(`  ✅ Base62 test ${decoded === testNum ? 'passed' : 'failed'}`);

// Test Base62 random
const randomCode = base62.generateRandom(7);
console.log(`  Random code: ${randomCode}`);
console.log(`  Valid: ${base62.isValid(randomCode)}`);
console.log(`  Length: ${randomCode.length}`);

// Test hashing
console.log('\n🔐 Testing Hash Utilities...');
const testData = 'https://example.com';
const hashed = hash.hashUrl(testData, 7);
console.log(`  URL: ${testData}`);
console.log(`  Hashed: ${hashed}`);
console.log(`  Length: ${hashed.length}`);

// Test SHA256
const sha256Hash = hash.sha256(testData);
console.log(`  SHA256: ${sha256Hash.substring(0, 20)}...`);

// Test short hash
const shortHash = hash.shortHash(testData, 8);
console.log(`  Short hash: ${shortHash}`);

// Test UUID
const uuid = hash.generateUUID();
console.log(`  UUID: ${uuid}`);

console.log('\n✅ All utility tests completed!');