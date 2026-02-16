
const BASE_URL = 'http://localhost:4000/api/v1';

async function testAuth() {
    console.log('--- Testing Auth & User Module ---');

    // 1. Try to register with mismatching passwords
    console.log('\n[TEST] Register with mismatching passwords...');
    const invalidUser = {
        name: 'Test User',
        email: 'test' + Date.now() + '@example.com',
        password: 'password123',
        confirmPassword: 'password456',
        role: 'user'
    };

    let res = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidUser)
    });

    let data;
    try {
        data = await res.json();
    } catch (e) {
        console.error('Failed to parse JSON response:', e);
        console.log('Response status:', res.status);
        // data = await res.text();
        // console.log('Response text:', data);
    }


    if (res.status === 400) {
        console.log('✅ Passed: Registration failed as expected (Password mismatch).');
    } else {
        console.error('❌ Failed: Expected 400, got', res.status, data);
    }

    // 2. Register success
    console.log('\n[TEST] Register success...');
    const validUser = { ...invalidUser, confirmPassword: 'password123' };
    res = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validUser)
    });
    data = await res.json();

    if (res.status === 200) {
        console.log('✅ Passed: Registration successful.');
        // console.log('User:', data.user);
    } else {
        console.error('❌ Failed: Registration error', res.status, data);
        return;
    }

    // 3. Login
    console.log('\n[TEST] Login...');
    res = await fetch(`${BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: validUser.email, password: validUser.password })
    });
    data = await res.json();

    let token = '';
    if (res.status === 200 && data.token) {
        console.log('✅ Passed: Login successful. Token received.');
        token = data.token;
    } else {
        console.error('❌ Failed: Login error', res.status, data);
        return;
    }

    // 4. Get All Users (Protected, Admin only)
    // Note: The user registered is role 'user' (default).
    // The route `getAllUsers` is protected and allowed for 'admin'.
    // So this should fail with 401 or 403?
    // Let's check `auth.controller.js` `allowedTo`.
    // It returns 401 if role not included.

    console.log('\n[TEST] Get All Users (as user role - expect fail)...');
    res = await fetch(`${BASE_URL}/users`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'token': token
        }
    });

    if (res.status === 401 || res.status === 403) {
        console.log('✅ Passed: Access denied for non-admin.');
    } else {
        console.log('⚠️ Unexpected status:', res.status); // Might be 200 if role logic is different?
        // userModel default role is "user".
        // user.router.js: userRouter.get('/', protectedRoutes, allowedTo("admin"), getAllUsers)
        // expected failure.
    }
}

testAuth().catch(console.error);
