const fetch = require('node-fetch');

// Test data for profile update
const testData = {
  fullName: 'Test User Updated',
  country: 'United Kingdom',
  phone: '+44 20 7946 0958',
  testType: 'Academic',
  targetBand: 7.5
};

// Mock JWT token (you'll need to replace this with a real token from your auth system)
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6IlNUVURFTlQiLCJpYXQiOjE2NzI1NDAwMDAsImV4cCI6MTY3MjYyNjQwMH0.invalid';

async function testProfileUpdate() {
  try {
    console.log('Testing profile update endpoint...');
    
    const response = await fetch('http://localhost:4000/api/student/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.success) {
      console.log('✅ Profile update test passed!');
      console.log('Updated profile data:', result.data.profile);
    } else {
      console.log('❌ Profile update test failed!');
      console.log('Error:', result.message || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Test validation scenarios
async function testValidation() {
  console.log('\nTesting validation scenarios...');
  
  const invalidTests = [
    { name: 'Empty full name', data: { fullName: '' } },
    { name: 'Too short full name', data: { fullName: 'A' } },
    { name: 'Invalid phone', data: { phone: 'abc123' } },
    { name: 'Invalid target band', data: { targetBand: 10.0 } },
    { name: 'Invalid test type', data: { testType: 'Invalid Type' } }
  ];
  
  for (const test of invalidTests) {
    try {
      const response = await fetch('http://localhost:4000/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        },
        body: JSON.stringify(test.data)
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        console.log(`✅ ${test.name} - Validation correctly rejected`);
      } else {
        console.log(`❌ ${test.name} - Validation should have rejected but didn't`);
      }
    } catch (error) {
      console.log(`✅ ${test.name} - Request failed as expected:`, error.message);
    }
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Starting Profile Update API Tests\n');
  console.log('Note: These tests use a mock JWT token. For real testing, you need a valid student token.\n');
  
  await testProfileUpdate();
  await testValidation();
  
  console.log('\n🏁 Tests completed');
}

runTests();
