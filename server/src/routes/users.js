const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');

router.get('/', requireAuth, async (req, res) => {
  const q = req.query.q?.trim();
  const filter = q
    ? { _id: { $ne: req.user._id }, $or: [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }] }
    : { _id: { $ne: req.user._id } };
  const users = await User.find(filter).limit(50);
  res.json(users.map((u) => u.toSafeJSON()));
});

module.exports = router;


