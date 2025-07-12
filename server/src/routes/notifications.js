const express = require('express');
const supabase = require('../utils/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications
// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const unread = req.query.unread === 'true';

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (unread) query = query.eq('is_read', false);

    const { data: notifications, error, count } = await query;
    if (error) return res.status(500).json({ error: 'Failed to fetch notifications' });

    const totalPages = Math.ceil((count || 0) / limit);
    const pagination = {
      currentPage: page,
      totalPages,
      totalItems: count || 0,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    res.json({ notifications, pagination, unreadCount: unreadCount || 0 });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/notifications/:id/read
// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) return res.status(500).json({ error: 'Failed to mark as read' });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/notifications/mark-all-read
// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) return res.status(500).json({ error: 'Failed to mark all as read' });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/notifications/:id
// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) return res.status(500).json({ error: 'Failed to delete notification' });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/notifications/unread-count
// Get unread notification count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) return res.status(500).json({ error: 'Failed to get unread count' });
    res.json({ count: count || 0 });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 