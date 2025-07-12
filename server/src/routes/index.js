const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const questionRoutes = require('./questions');

const router = express.Router();

router.use('/auth', authRoutes);
router.use("/users", userRoutes);
router.use("/questions", questionRoutes);

module.exports = router;
