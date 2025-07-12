const express = require('express');
const { z } = require('zod');
const supabase = require('../utils/supabase');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createQuestionSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(1000),
  tags: z.array(z.string().uuid()).optional()
});

const updateQuestionSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(10).max(1000).optional(),
  tags: z.array(z.string().uuid()).optional()
});

// GET /api/questions
// Route to get all questions with pagination and filters
// Query Parameters: { page?: number, limit?: number, sort?: string, tags?: string, search?: string }
// Returns: { questions: array, pagination: object, totalCount: number }
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'newest', tags, search } = req.query;

    let query = supabase.from('questions').select('*');

    if (tags) query = query.in('tags', tags.split(','));
    if (search) query = query.ilike('title', `%${search}%`);

    if (sort === 'newest') query = query.order('created_at', { ascending: false });
    else query = query.order('vote_score', { ascending: false });

    const { data: questions, error } = await query.range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    const { count: totalCount } = await supabase.from('questions').select('*', { count: 'exact' });

    res.json({ questions, pagination: { page, limit }, totalCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// GET /api/questions/:id
// Route to get a question by ID along with its answers and tags
// URL Parameters: { id: string (UUID) }
// Returns: { question: object }
router.get('/:id', async (req, res) => {
  try {
    // Fetch question with answers and associated tags via junction table
    const { data: questionData, error } = await supabase
      .from('questions')
      .select('*, answers:answers!answers_question_id_fkey(*), question_tags(tag_id, tags(*))')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    // Flatten tags from junction data
    const question = {
      ...questionData,
      tags: questionData.question_tags?.map(qt => qt.tags) || []
    };

    res.json({ question });
  } catch (error) {
    console.error('Error in GET /api/questions/:id', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// POST /api/questions
// Route to create a new question
// Headers: { Authorization: "Bearer <accessToken>" }
// Request Body: { title: string, description: string, tags: array }
// Returns: { question: object }
router.post('/', authenticateToken, authorizeRole('user', 'admin'), async (req, res) => {
  try {
    const validation = createQuestionSchema.safeParse(req.body);
    if (!validation.success) {
      console.error('Validation failed:', validation.error.errors);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }

    const { title, description, tags } = validation.data;

    // Insert the question into the database
    const { data: questions, error: questionError } = await supabase
      .from('questions')
      .insert({
        title,
        description,
        user_id: req.user.id,
      })
      .select();

    if (questionError || !questions || questions.length === 0) {
      console.error('Error inserting question or empty response:', questionError);
      return res.status(500).json({ error: 'Failed to insert question into database' });
    }

    const question = questions[0];

    // Update the question_tags table
    if (tags && tags.length > 0) {
      const questionTags = tags.map(tagId => ({ question_id: question.id, tag_id: tagId }));

      const { data: insertedTags, error: tagsError } = await supabase
        .from('question_tags')
        .insert(questionTags)
        .select();

      if (tagsError) {
        console.error('Error inserting question tags:', tagsError);
        console.error('Failed question tags payload:', questionTags);
        return res.status(500).json({ error: 'Failed to insert question tags into database' });
      }

      console.log('Inserted question tags:', insertedTags);
    }

    res.status(201).json({ question });
  } catch (error) {
    console.error('Unexpected error in POST /api/questions:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// Warning: untested code
// PUT /api/questions/:id
// Route to update a question (only by owner)
// Headers: { Authorization: "Bearer <accessToken>" }
// Request Body: { title?: string, description?: string, tags?: array }
// Returns: { question: object }
router.put('/:id', authenticateToken, authorizeRole('user', 'admin'), async (req, res) => {
  try {
    const validation = updateQuestionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }

    const updates = validation.data;

    const { data: question, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;

    res.json({ question });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Warning: untested code
// DELETE /api/questions/:id
// Route to delete a question (only by owner or admin)
// Headers: { Authorization: "Bearer <accessToken>" }
// Returns: { message: string }
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Warning: untested code
// POST /api/questions/:id/views
// Route to increment the view count of a question
// URL Parameters: { id: string (UUID) }
// Returns: { viewCount: number }
router.post('/:id/views', async (req, res) => {
  try {
    const { data: question, error } = await supabase
      .from('questions')
      .update({ view_count: supabase.raw('view_count + 1') })
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    res.json({ viewCount: question.view_count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to increment view count' });
  }
});

// Warning: untested code
// POST /api/questions/:id/close
// Route to close a question (admin only)
// Headers: { Authorization: "Bearer <accessToken>" }
// Returns: { message: string }
router.post('/:id/close', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('questions')
      .update({ is_closed: true })
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Question closed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to close question' });
  }
});

// Warning: untested code
// POST /api/questions/:id/reopen
// Route to reopen a question (admin only)
// Headers: { Authorization: "Bearer <accessToken>" }
// Returns: { message: string }
router.post('/:id/reopen', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('questions')
      .update({ is_closed: false })
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Question reopened successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reopen question' });
  }
});

module.exports = router;
