const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signJwt } = require('../utils/jwt');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already in use' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    const token = signJwt(user);
    return res.json({ token, user: user.toSafeJSON() });
  } catch (e) {
    if (e && e.code === 11000) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    console.error('Auth register error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signJwt(user);
    return res.json({ token, user: user.toSafeJSON() });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


