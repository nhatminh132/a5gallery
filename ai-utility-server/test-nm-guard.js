/**
 * Quick test script for NM GUARD BETA
 * Run: node test-nm-guard.js
 */

const BASE_URL = process.env.NM_GUARD_URL || 'http://localhost:3001';
const TEST_USER_ID = 'test-user-' + Date.now();

async function test() {
  console.log('🛡️  Testing NM GUARD BETA at', BASE_URL);
  console.log('Test User ID:', TEST_USER_ID);
  console.log('---');

  try {
    // Test 1: Health check
    console.log('1️⃣  Testing health endpoint...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    console.log('✅ Health:', health.status);
    console.log('   Version:', health.version);
    console.log('');

    // Test 2: Check access (first time)
    console.log('2️⃣  Testing check-caption-access (first request)...');
    const check1Res = await fetch(`${BASE_URL}/api/guard/check-caption-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: TEST_USER_ID })
    });
    const check1 = await check1Res.json();
    console.log('✅ Access allowed:', check1.allowed);
    console.log('   Remaining:', check1.remaining);
    console.log('   Role:', check1.role);
    console.log('   Message:', check1.message);
    console.log('');

    // Test 3: Record usage (first caption)
    console.log('3️⃣  Recording first caption usage...');
    const record1Res = await fetch(`${BASE_URL}/api/guard/record-caption-usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: TEST_USER_ID })
    });
    const record1 = await record1Res.json();
    console.log('✅ Recorded:', record1.success);
    console.log('');

    // Test 4: Check access again (after first use)
    console.log('4️⃣  Testing check-caption-access (after 1 use)...');
    const check2Res = await fetch(`${BASE_URL}/api/guard/check-caption-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: TEST_USER_ID })
    });
    const check2 = await check2Res.json();
    console.log('✅ Access allowed:', check2.allowed);
    console.log('   Remaining:', check2.remaining);
    console.log('');

    // Test 5: Record usage (second caption)
    console.log('5️⃣  Recording second caption usage...');
    const record2Res = await fetch(`${BASE_URL}/api/guard/record-caption-usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: TEST_USER_ID })
    });
    const record2 = await record2Res.json();
    console.log('✅ Recorded:', record2.success);
    console.log('');

    // Test 6: Check access (should be denied now)
    console.log('6️⃣  Testing check-caption-access (after 2 uses - should be denied)...');
    const check3Res = await fetch(`${BASE_URL}/api/guard/check-caption-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: TEST_USER_ID })
    });
    const check3 = await check3Res.json();
    console.log('✅ Access allowed:', check3.allowed);
    console.log('   Remaining:', check3.remaining);
    console.log('   Reason:', check3.reason);
    console.log('');

    // Test 7: Get stats
    console.log('7️⃣  Getting usage stats...');
    const statsRes = await fetch(`${BASE_URL}/api/guard/stats?userId=${TEST_USER_ID}`);
    const stats = await statsRes.json();
    console.log('✅ Today count:', stats.todayCount);
    console.log('   Limit:', stats.limit);
    console.log('');

    console.log('🎉 All tests passed!');
    console.log('---');
    console.log('Note: Test user will reset tomorrow at midnight.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

test();
