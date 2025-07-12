const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const questionRoutes = require('./questions');
const answerRoutes = require('./answers');

const router = express.Router();

router.use('/auth', authRoutes);
router.use("/users", userRoutes);
router.use("/questions", questionRoutes);
router.use("/answers", answerRoutes);

module.exports = router;
