const express = require('express');
const { z } = require('zod');
const supabase = require('../utils/supabase');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// WARNING: role based routes not working, fix that

const router = express.Router();

// Validation schemas
const createTagSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional()
});
const updateTagSchema = createTagSchema.partial();

// GET /api/tags
// Route to get all tags with optional search, limit, and sort
// Query Parameters: { search?: string, limit?: number (default: 50, max: 100), sort?: 'popular'|'name' (default: 'name') }
// Returns: { tags: array }
router.get('/', async (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const sort = req.query.sort || 'name';

    let query = supabase
      .from('tags')
      .select('*')
      .limit(limit);

    if (search) query = query.ilike('name', `%${search}%`);

    if (sort === 'popular') {
      query = query.order('usage_count', { ascending: false });
    } else {
      query = query.order('name', { ascending: true });
    }

    const { data: tags, error } = await query;
    if (error) throw error;

    res.json({ tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// GET /api/tags/:id
// Route to get tag by ID with paginated list of questions
// Query Parameters: { page?: number (default:1), limit?: number (default:10, max:50) }
// Returns: { tag: object, questions: array, pagination: object }
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;

    // Get tag info
    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .single();
    if (tagError || !tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Get questions associated with this tag
    const { data: entries, error, count } = await supabase
      .from('question_tags')
      .select('questions(id, title, description, view_count, vote_score, is_closed, created_at, updated_at)', { count: 'exact' })
      .eq('tag_id', id)
      .order('questions.created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const questions = entries.map(e => e.questions);
    const totalPages = Math.ceil((count || 0) / limit);
    const pagination = {
      currentPage: page,
      totalPages,
      totalItems: count || 0,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    res.json({ tag, questions, pagination });
  } catch (error) {
    console.error('Error fetching tag details:', error);
    res.status(500).json({ error: 'Failed to fetch tag details' });
  }
});

// POST /api/tags
// Route to create a new tag (admin only)
// Headers: { Authorization: "Bearer <accessToken>" }
// Request Body: { name: string, description?: string, color?: string }
// Returns: { tag: object }
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const validation = createTagSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
    }

    const { name, description, color } = validation.data;
    const { data: inserted, error } = await supabase
      .from('tags')
      .insert({ name, description, color })
      .select()
      .single();

    if (error || !inserted) {
      console.error('Error creating tag:', error);
      return res.status(500).json({ error: 'Failed to create tag' });
    }

    res.status(201).json({ tag: inserted });
  } catch (error) {
    console.error('Unexpected error creating tag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tags/:id
// Route to update an existing tag (admin only)
// Headers: { Authorization: "Bearer <accessToken>" }
// Request Body: { name?: string, description?: string, color?: string }
// Returns: { tag: object }
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const validation = updateTagSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
    }

    const { id } = req.params;
    const updates = validation.data;

    const { data: updated, error } = await supabase
      .from('tags')
      .update({ ...updates })
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) {
      console.error('Error updating tag:', error);
      return res.status(500).json({ error: 'Failed to update tag' });
    }

    res.json({ tag: updated });
  } catch (error) {
    console.error('Unexpected error updating tag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tags/:id
// Route to delete an existing tag (admin only)
// Headers: { Authorization: "Bearer <accessToken>" }
// Returns: { message: string }
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting tag:', error);
      return res.status(500).json({ error: 'Failed to delete tag' });
    }

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Unexpected error deleting tag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
