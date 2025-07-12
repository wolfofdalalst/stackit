const express = require('express');
const { z } = require('zod');
const supabase = require('../utils/supabase');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createAnswerSchema = z.object({
  content: z.string().min(1)
});
const updateAnswerSchema = z.object({
  content: z.string().min(1)
});

// GET /api/answers/questions/:questionId/
// Route to get paginated list of answers for a specific question
// Query Parameters: { page?: number (default:1), limit?: number (default:10, max:50), sort?: 'newest'|'oldest'|'votes' (default:'newest') }
// Returns: { answers: array, pagination: { currentPage, totalPages, totalItems, hasNext, hasPrev } }
router.get('/questions/:questionId/', async (req, res) => {
  try {
    const { questionId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const sort = req.query.sort || 'newest';
    const offset = (page - 1) * limit;

    let orderBy = 'created_at';
    let ascending = false;
    switch (sort) {
      case 'oldest':
        ascending = true;
        break;
      case 'votes':
        orderBy = 'vote_score';
        break;
      default:
        break;
    }

    const { data: answers, error, count } = await supabase
      .from('answers')
      .select('*', { count: 'exact' })
      .eq('question_id', questionId)
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / limit);
    const pagination = {
      currentPage: page,
      totalPages,
      totalItems: count || 0,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    res.json({ answers, pagination });
  } catch (error) {
    console.error('Error fetching answers:', error);
    res.status(500).json({ error: 'Failed to fetch answers' });
  }
});

// POST /api/answers/questions/:questionId/
// Route to create a new answer for a specific question
// Headers: { Authorization: "Bearer <accessToken>" }
// Request Body: { content: string }
// Returns: { answer: object }
router.post('/questions/:questionId/', authenticateToken, async (req, res) => {
  try {
    const validation = createAnswerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
    }

    const { content } = validation.data;
    const { questionId } = req.params;

    const { data: inserted, error } = await supabase
      .from('answers')
      .insert({ content, question_id: questionId, user_id: req.user.id })
      .select();

    if (error || !inserted || inserted.length === 0) {
      console.error('Error inserting answer:', error);
      return res.status(500).json({ error: 'Failed to create answer' });
    }

    res.status(201).json({ answer: inserted[0] });
  } catch (error) {
    console.error('Unexpected error creating answer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Warning: untested code
// PUT /api/answers/:id
// Route to update an existing answer (only by owner)
// Headers: { Authorization: "Bearer <accessToken>" }
// Request Body: { content: string }
// Returns: { answer: object }
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const validation = updateAnswerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
    }

    const { id } = req.params;
    const { content } = validation.data;

    // Check ownership
    const { data: existing, error: fetchError } = await supabase
      .from('answers')
      .select('user_id')
      .eq('id', id)
      .single();
    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Answer not found' });
    }
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: updated, error } = await supabase
      .from('answers')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error || !updated || updated.length === 0) {
      console.error('Error updating answer:', error);
      return res.status(500).json({ error: 'Failed to update answer' });
    }

    res.json({ answer: updated[0] });
  } catch (error) {
    console.error('Unexpected error updating answer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Warning: untested code
// DELETE /api/answers/:id
// Route to delete an existing answer (only by owner or admin)
// Headers: { Authorization: "Bearer <accessToken>" }
// Returns: { message: string }
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership or admin
    const { data: existing, error: fetchError } = await supabase
      .from('answers')
      .select('user_id')
      .eq('id', id)
      .single();
    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Answer not found' });
    }
    if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error } = await supabase
      .from('answers')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting answer:', error);
      return res.status(500).json({ error: 'Failed to delete answer' });
    }

    res.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    console.error('Unexpected error deleting answer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
