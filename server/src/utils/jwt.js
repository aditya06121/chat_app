const jwt = require('jsonwebtoken');

function signJwt(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return jwt.sign({ sub: user._id.toString(), email: user.email }, secret, { expiresIn: '7d' });
}

function verifyJwt(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return jwt.verify(token, secret);
}

module.exports = { signJwt, verifyJwt };


