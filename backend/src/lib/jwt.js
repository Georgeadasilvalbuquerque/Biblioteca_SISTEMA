const jwt = require('jsonwebtoken');

function getSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET nao configurado no .env');
    }
    return secret;
}

function signToken(payload) {
    return jwt.sign(payload, getSecret(), {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });
}

function verifyToken(token) {
    return jwt.verify(token, getSecret());
}

module.exports = {
    signToken,
    verifyToken,
};