const express = require('express');
const { z } = require('zod');
const supabase = require('../utils/supabase');
const { authenticateToken } = require('../middleware/auth');

// CAUTION: test all the routes

const router = express.Router();

// Validation schema for comments
const commentSchema = z.object({
  content: z.string().min(1)
});

// GET /api/comments/answers/:answerId/
// Get comments for an answer
router.get('/answers/:answerId', async (req, res) => {
  try {
    const { answerId } = req.params;
    const { data: comments, error } = await supabase
      .from('comments')
      .select('id, content, user_id, created_at, updated_at')
      .eq('answer_id', answerId);

    if (error) {
      console.error('Error fetching comments:', error);
      return res.status(500).json({ error: 'Failed to fetch comments' });
    }

    res.json({ comments });
  } catch (error) {
    console.error('Unexpected error fetching comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/comments/answers/:answerId/
// Add comment to answer (authenticated)
router.post('/answers/:answerId', authenticateToken, async (req, res) => {
  try {
    const validation = commentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
    }
    const { content } = validation.data;
    const { answerId } = req.params;
    const userId = req.user.id;

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({ content, answer_id: answerId, user_id: userId })
      .select('id, content, answer_id, user_id, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error inserting comment:', error);
      return res.status(500).json({ error: 'Failed to add comment' });
    }

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Unexpected error adding comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/comments/:id
// Update comment (only by owner)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const validation = commentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
    }
    const { content } = validation.data;
    const { id } = req.params;

    const { data: comment, error } = await supabase
      .from('comments')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select('id, content, answer_id, user_id, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      return res.status(500).json({ error: 'Failed to update comment' });
    }
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found or not authorized' });
    }

    res.json({ comment });
  } catch (error) {
    console.error('Unexpected error updating comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/comments/:id
// Delete comment (only by owner or admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Fetch existing comment to check ownership
    const { data: existingComment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (existingComment.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting comment:', error);
      return res.status(500).json({ error: 'Failed to delete comment' });
    }

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Unexpected error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
