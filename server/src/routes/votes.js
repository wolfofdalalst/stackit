const express = require('express');
const { z } = require('zod');
const supabase = require('../utils/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation schema for voting
const voteSchema = z.object({
  voteType: z.enum(['upvote', 'downvote'])
});

// POST /api/vote/question/:id
// Route to cast or change a vote on a question
// Headers: { Authorization: "Bearer <accessToken>" }
// Request Body: { voteType: 'upvote' | 'downvote' }
// Returns: { voteScore: number, userVote: string }
router.post('/question/:id', authenticateToken, async (req, res) => {
  try {
    const validation = voteSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
    }
    const { voteType } = validation.data;
    const questionId = req.params.id;
    const userId = req.user.id;

    // Remove any existing vote by this user on this question
    await supabase
      .from('votes')
      .delete()
      .eq('votable_type', 'question')
      .eq('votable_id', questionId)
      .eq('user_id', userId);

    // Insert new vote
    await supabase
      .from('votes')
      .insert({ user_id: userId, votable_type: 'question', votable_id: questionId, vote_type: voteType });

    // Recalculate vote score
    const { count: upCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('votable_type', 'question')
      .eq('votable_id', questionId)
      .eq('vote_type', 'upvote');
    const { count: downCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('votable_type', 'question')
      .eq('votable_id', questionId)
      .eq('vote_type', 'downvote');
    const voteScore = (upCount || 0) - (downCount || 0);

    // Update question vote_score
    await supabase
      .from('questions')
      .update({ vote_score: voteScore })
      .eq('id', questionId);

    res.json({ voteScore, userVote: voteType });
  } catch (error) {
    console.error('Error voting on question:', error);
    res.status(500).json({ error: 'Failed to vote on question' });
  }
});

// DELETE /api/vote/question/:id
// Route to remove a vote from a question
// Headers: { Authorization: "Bearer <accessToken>" }
// Returns: { voteScore: number }
router.delete('/question/:id', authenticateToken, async (req, res) => {
  try {
    const questionId = req.params.id;
    const userId = req.user.id;

    // Delete vote
    await supabase
      .from('votes')
      .delete()
      .eq('votable_type', 'question')
      .eq('votable_id', questionId)
      .eq('user_id', userId);

    // Recalculate vote score
    const { count: upCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('votable_type', 'question')
      .eq('votable_id', questionId)
      .eq('vote_type', 'upvote');
    const { count: downCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('votable_type', 'question')
      .eq('votable_id', questionId)
      .eq('vote_type', 'downvote');
    const voteScore = (upCount || 0) - (downCount || 0);

    // Update question vote_score
    await supabase
      .from('questions')
      .update({ vote_score: voteScore })
      .eq('id', questionId);

    res.json({ voteScore });
  } catch (error) {
    console.error('Error removing vote from question:', error);
    res.status(500).json({ error: 'Failed to remove vote from question' });
  }
});

// POST /api/vote/answer/:id
// Route to cast or change a vote on an answer
// Headers: { Authorization: "Bearer <accessToken>" }
// Request Body: { voteType: 'upvote' | 'downvote' }
// Returns: { voteScore: number, userVote: string }
router.post('/answer/:id', authenticateToken, async (req, res) => {
  try {
    const validation = voteSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
    }
    const { voteType } = validation.data;
    const answerId = req.params.id;
    const userId = req.user.id;

    // Remove any existing vote by this user on this answer
    await supabase
      .from('votes')
      .delete()
      .eq('votable_type', 'answer')
      .eq('votable_id', answerId)
      .eq('user_id', userId);

    // Insert new vote
    await supabase
      .from('votes')
      .insert({ user_id: userId, votable_type: 'answer', votable_id: answerId, vote_type: voteType });

    // Recalculate vote score
    const { count: upCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('votable_type', 'answer')
      .eq('votable_id', answerId)
      .eq('vote_type', 'upvote');
    const { count: downCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('votable_type', 'answer')
      .eq('votable_id', answerId)
      .eq('vote_type', 'downvote');
    const voteScore = (upCount || 0) - (downCount || 0);

    // Update answer vote_score
    await supabase
      .from('answers')
      .update({ vote_score: voteScore })
      .eq('id', answerId);

    res.json({ voteScore, userVote: voteType });
  } catch (error) {
    console.error('Error voting on answer:', error);
    res.status(500).json({ error: 'Failed to vote on answer' });
  }
});

// DELETE /api/vote/answer/:id
// Route to remove a vote from an answer
// Headers: { Authorization: "Bearer <accessToken>" }
// Returns: { voteScore: number }
router.delete('/answer/:id', authenticateToken, async (req, res) => {
  try {
    const answerId = req.params.id;
    const userId = req.user.id;

    // Delete vote
    await supabase
      .from('votes')
      .delete()
      .eq('votable_type', 'answer')
      .eq('votable_id', answerId)
      .eq('user_id', userId);

    // Recalculate vote score
    const { count: upCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('votable_type', 'answer')
      .eq('votable_id', answerId)
      .eq('vote_type', 'upvote');
    const { count: downCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('votable_type', 'answer')
      .eq('votable_id', answerId)
      .eq('vote_type', 'downvote');
    const voteScore = (upCount || 0) - (downCount || 0);

    // Update answer vote_score
    await supabase
      .from('answers')
      .update({ vote_score: voteScore })
      .eq('id', answerId);

    res.json({ voteScore });
  } catch (error) {
    console.error('Error removing vote from answer:', error);
    res.status(500).json({ error: 'Failed to remove vote from answer' });
  }
});

module.exports = router;
