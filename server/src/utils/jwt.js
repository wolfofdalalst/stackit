const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const generateAccessToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '6h' });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken
};
