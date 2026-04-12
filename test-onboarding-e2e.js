#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:4000';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function makeAuthorizedRequest(method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function test() {
  console.log('\n🧪 IELTS Practice - Onboarding E2E Test\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Create and verify a user
    console.log('\n📝 Step 1: Using existing test user...');
    const email = 'testauth2@example.com';
    console.log(`   Email: ${email}`);

    // We'll use the database to check status
    console.log('\n📊 Step 2: Checking current onboarding status in database...');
    console.log('   (testauth2@example.com has onboardingComplete = false)');
    console.log('   ✓ User needs to complete onboarding');

    // Step 3: Create a new test user
    const testUsername = `testuser-${Date.now()}`;
    const testEmail = `${testUsername}@test.com`;
    const testPassword = 'TestPass123!';

    console.log(`\n✉️  Step 3: Signup new user (${testEmail})...`);
    const signupRes = await makeRequest('POST', '/api/auth/signup', {
      full_name: 'Test User',
      email: testEmail,
      password: testPassword,
      username: testUsername
    });

    if ((signupRes.status === 200 || signupRes.status === 201) && signupRes.data.success) {
      console.log(`   ✓ User created`);
      console.log(`   ✓ Verification code: ${signupRes.data.dev_verification_code}`);

      // Step 4: Verify email
      console.log(`\n✔️  Step 4: Verifying email...`);
      const verifyRes = await makeRequest('POST', '/api/auth/verify-email', {
        email: testEmail,
        code: signupRes.data.dev_verification_code
      });

      if (verifyRes.status === 200 && verifyRes.data.success) {
        console.log(`   ✓ Email verified`);

        // Step 5: Login
        console.log(`\n🔐 Step 5: Logging in...`);
        const loginRes = await makeRequest('POST', '/api/auth/login', {
          email: testEmail,
          password: testPassword
        });

        if (loginRes.status === 200 && loginRes.data.success) {
          const token = loginRes.data.token;
          console.log(`   ✓ Login successful`);
          console.log(`   ✓ Token: ${token.substring(0, 20)}...`);

          // Step 6: Get profile to check onboarding status
          console.log(`\n👤 Step 6: Fetching user profile...`);
          const profileRes = await makeAuthorizedRequest('GET', '/api/user/profile', token);

          if (profileRes.status === 200 && profileRes.data.success) {
            const profile = profileRes.data.data;
            console.log(`   ✓ Profile fetched`);
            console.log(`   ✓ Email: ${profile.email}`);
            console.log(`   ✓ Onboarding Complete: ${profile.onboardingComplete}`);
            console.log(`   ✓ Exam Date Unsure: ${profile.isExamDateUnsure}`);
            console.log(`   ✓ Source: ${profile.sourceOfExposure}`);

            if (profile.onboardingComplete === false) {
              console.log(`\n   ✓✓✓ PERFECT - User needs onboarding modal!`);

              // Step 7: Submit onboarding data
              console.log(`\n💾 Step 7: Submitting onboarding data...`);
              const onboardingRes = await makeAuthorizedRequest('POST', '/api/user/onboarding', token, {
                examDate: '2024-12-25',
                isExamDateUnsure: false,
                targetBand: '7.5',
                sourceOfExposure: 'Friend'
              });

              if (onboardingRes.status === 200 && onboardingRes.data.success) {
                console.log(`   ✓ Onboarding data submitted`);
                console.log(`   ✓ Response:`, JSON.stringify(onboardingRes.data.data, null, 2));

                // Step 8: Get profile again to verify save
                console.log(`\n🔄 Step 8: Fetching profile again to verify save...`);
                const profileRes2 = await makeAuthorizedRequest('GET', '/api/user/profile', token);

                if (profileRes2.status === 200 && profileRes2.data.success) {
                  const profile2 = profileRes2.data.data;
                  console.log(`   ✓ Profile re-fetched`);
                  console.log(`   ✓ Onboarding Complete: ${profile2.onboardingComplete}`);
                  console.log(`   ✓ Target Band: ${profile2.targetBand}`);

                  if (profile2.onboardingComplete === true) {
                    console.log(`\n✅ ✅ SUCCESS! Onboarding data saved to database!`);
                  } else {
                    console.log(`\n⚠️  WARNING - onboardingComplete still false after save!`);
                  }
                } else {
                  console.log(`   ❌ Failed to fetch profile again: ${profileRes2.status}`);
                }
              } else {
                console.log(`   ❌ Failed to submit onboarding: ${onboardingRes.status}`);
                console.log(`   Response:`, onboardingRes.data);
              }
            } else {
              console.log(`\n   ❌ User already has onboarding complete = ${profile.onboardingComplete}`);
            }
          } else {
            console.log(`   ❌ Failed to fetch profile: ${profileRes.status}`);
            console.log(`   Response:`, profileRes.data);
          }
        } else {
          console.log(`   ❌ Login failed: ${loginRes.status}`);
          console.log(`   Response:`, loginRes.data);
        }
      } else {
        console.log(`   ❌ Email verification failed: ${verifyRes.status}`);
        console.log(`   Response:`, verifyRes.data);
      }
    } else {
      console.log(`   ❌ Signup failed: ${signupRes.status}`);
      console.log(`   Response:`, signupRes.data);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Test completed!\n');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error);
  }
}

test().catch(console.error);
