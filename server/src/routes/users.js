const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const supabase = require('../utils/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const updateProfileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.email().optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.url().optional()
});


// GET /api/users/profile
// Route to get current authenticated user's profile information
// Headers: { Authorization: "Bearer <accessToken>" }
// Returns: { user: { id, username, email, avatar_url, bio, reputation, created_at, updated_at } }
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching profile for user ID:', req.user.id);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, avatar_url, bio, reputation, created_at, updated_at')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile from database:', error);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    console.log('Fetched user profile:', user);
    res.json({ user });
  } catch (error) {
    console.error('Unexpected error in /profile route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/profile
// Route to update current authenticated user's profile information
// Headers: { Authorization: "Bearer <accessToken>" }
// Request Body: { username?: string, email?: string, bio?: string, avatar_url?: string }
// Returns: { user: { id, username, email, avatar_url, bio, reputation, created_at, updated_at } }
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }

    const updates = validation.data;
    
    // Check if username or email already exists (if being updated)
    if (updates.username || updates.email) {
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id, username, email')
        .neq('id', req.user.id);

      if (checkError) {
        return res.status(500).json({ error: 'Failed to validate uniqueness' });
      }

      const usernameExists = updates.username && 
        existingUsers.some(user => user.username === updates.username);
      const emailExists = updates.email && 
        existingUsers.some(user => user.email === updates.email);

      if (usernameExists) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Update user
    const { data: user, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', req.user.id)
      .select('id, username, email, avatar_url, bio, reputation, created_at, updated_at')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/change-password
// Route to change current authenticated user's password
// Headers: { Authorization: "Bearer <accessToken>" }
// Request Body: { currentPassword: string, newPassword: string, confirmPassword: string }
// Returns: { message: string }
// TODO

// GET /api/users/:id
// Route to get public profile of a user by their ID, includes user stats
// URL Parameters: { id: string (UUID) }
// Returns: { user: { id, username, avatar_url, bio, reputation, created_at }, stats: { questions, answers, acceptedAnswers } }
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get user basic info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, avatar_url, bio, reputation, created_at')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's questions count
    const { count: questionsCount, error: questionsError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    // Get user's answers count
    const { count: answersCount, error: answersError } = await supabase
      .from('answers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    // Get accepted answers count
    const { count: acceptedAnswersCount, error: acceptedError } = await supabase
      .from('answers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)
      .eq('is_accepted', true);

    if (questionsError || answersError || acceptedError) {
      console.error('Error fetching user stats:', { questionsError, answersError, acceptedError });
    }

    const stats = {
      questions: questionsCount || 0,
      answers: answersCount || 0,
      acceptedAnswers: acceptedAnswersCount || 0
    };

    res.json({ user, stats });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// WARNING: Untested code
// GET /api/users/:id/questions
// Route to get paginated list of questions asked by a specific user
// URL Parameters: { id: string (UUID) }
// Query Parameters: { page?: number (default: 1), limit?: number (default: 10, max: 50), sort?: 'newest'|'oldest'|'most-votes'|'most-views' (default: 'newest') }
// Returns: { questions: array, pagination: { currentPage, totalPages, totalItems, hasNext, hasPrev } }
router.get('/:id/questions', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 per page
    const sort = req.query.sort || 'newest';
    
    const offset = (page - 1) * limit;

    // Determine sorting
    let orderBy = 'created_at';
    let ascending = false;
    
    switch (sort) {
      case 'oldest':
        orderBy = 'created_at';
        ascending = true;
        break;
      case 'most-votes':
        orderBy = 'vote_score';
        ascending = false;
        break;
      case 'most-views':
        orderBy = 'view_count';
        ascending = false;
        break;
      default: // newest
        orderBy = 'created_at';
        ascending = false;
    }

    // Check if user exists
    const { data: userExists } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get questions with pagination
    const { data: questions, error, count } = await supabase
      .from('questions')
      .select(`
        id, title, description, view_count, vote_score, 
        is_closed, created_at, updated_at,
        accepted_answer_id
      `, { count: 'exact' })
      .eq('user_id', id)
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch questions' });
    }

    const totalPages = Math.ceil(count / limit);
    const pagination = {
      currentPage: page,
      totalPages,
      totalItems: count,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    res.json({ questions, pagination });
  } catch (error) {
    console.error('Get user questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// WARNING: Untested code
// GET /api/users/:id/answers
// Route to get paginated list of answers provided by a specific user
// URL Parameters: { id: string (UUID) }
// Query Parameters: { page?: number (default: 1), limit?: number (default: 10, max: 50), sort?: 'newest'|'oldest'|'most-votes' (default: 'newest') }
// Returns: { answers: array, pagination: { currentPage, totalPages, totalItems, hasNext, hasPrev } }
router.get('/:id/answers', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 per page
    const sort = req.query.sort || 'newest';
    
    const offset = (page - 1) * limit;

    // Determine sorting
    let orderBy = 'created_at';
    let ascending = false;
    
    switch (sort) {
      case 'oldest':
        orderBy = 'created_at';
        ascending = true;
        break;
      case 'most-votes':
        orderBy = 'vote_score';
        ascending = false;
        break;
      default: // newest
        orderBy = 'created_at';
        ascending = false;
    }

    // Check if user exists
    const { data: userExists } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get answers with question info and pagination
    const { data: answers, error, count } = await supabase
      .from('answers')
      .select(`
        id, content, is_accepted, vote_score, 
        created_at, updated_at,
        questions!inner(id, title)
      `, { count: 'exact' })
      .eq('user_id', id)
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch answers' });
    }

    const totalPages = Math.ceil(count / limit);
    const pagination = {
      currentPage: page,
      totalPages,
      totalItems: count,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    res.json({ answers, pagination });
  } catch (error) {
    console.error('Get user answers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
