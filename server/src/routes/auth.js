const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();

const supabaseClient = require('../utils/supabase');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');

// POST /api/auth/register
// Route to register a new user. Validates passwords, hashes the password, and stores user data in the database.
// Request Body: { username: string, email: string, password: string, confirmPassword: string }
// Returns: { user: object, accessToken: string, refreshToken: string }
router.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Check if user with username or email already exists
    const { data: existingUser, error: checkError } = await supabaseClient
        .from('users')
        .select('id, username, email')
        .or(`username.eq.${username},email.eq.${email}`)
        .limit(1);

    if (checkError) {
        return res.status(500).json({ error: 'Database error during user check' });
    }

    if (existingUser && existingUser.length > 0) {
        const user = existingUser[0];
        if (user.username === username) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        if (user.email === email) {
            return res.status(409).json({ error: 'Email already exists' });
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabaseClient
        .from('users')
        .insert({ username, email, password_hash: hashedPassword })
        .select();

    if (error) {
        // Handle specific database constraint errors
        if (error.code === '23505') { // PostgreSQL unique violation error code
            if (error.message.includes('username')) {
                return res.status(409).json({ error: 'Username already exists' });
            }
            if (error.message.includes('email')) {
                return res.status(409).json({ error: 'Email already exists' });
            }
        }
        return res.status(400).json({ error: error.message });
    }

    if (!data || data.length === 0) {
        return res.status(500).json({ error: 'Failed to create user' });
    }

    const accessToken = generateAccessToken(data[0].id);
    const refreshToken = generateRefreshToken(data[0].id);

    res.status(201).json({ user: data[0], accessToken, refreshToken });
});

// POST /api/auth/login
// Route to log in a user. Validates email and password, and returns access and refresh tokens.
// Request Body: { email: string, password: string }
// Returns: { user: object, accessToken: string, refreshToken: string }
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !data) {
        return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, data.password_hash);

    if (!isValidPassword) {
        return res.status(400).json({ error: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(data.id);
    const refreshToken = generateRefreshToken(data.id);

    res.status(200).json({ user: data, accessToken, refreshToken });
});

// POST /api/auth/refresh
// Route to refresh the access token using a valid refresh token.
// Request Body: { refreshToken: string }
// Returns: { accessToken: string }
router.post('/refresh', (req, res) => {
    const { refreshToken } = req.body;

    try {
        const decoded = verifyToken(refreshToken);
        const accessToken = generateAccessToken(decoded.id);

        res.status(200).json({ accessToken });
    } catch (error) {
        res.status(400).json({ error: 'Invalid refresh token' });
    }
});

// TODO
// POST /api/auth/logout
// Route to log out a user. Invalidates the refresh token and verifies the access token.
router.post('/logout', async (req, res) => {});

module.exports = router;
