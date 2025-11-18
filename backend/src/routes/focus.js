const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// Get focus settings for a user
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const [settings] = await db.query(
      'SELECT * FROM focus_settings WHERE user_id = ?',
      [userId]
    );

    if (settings.length === 0) {
      // Return default settings if none exist
      return res.json({
        userId: userId,
        blur_intensity: 5,
        dim_opacity: 70,
        hide_timer: false,
        hide_score: false,
        hide_navigation: false,
        fullscreen_mode: true,
        sound_enabled: false,
        theme: 'auto'
      });
    }

    res.json(settings[0]);
  } catch (error) {
    console.error('Error fetching focus settings:', error);
    res.status(500).json({ error: 'Failed to fetch focus settings' });
  }
});

// Update focus settings
router.put('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const {
      blur_intensity,
      dim_opacity,
      hide_timer,
      hide_score,
      hide_navigation,
      fullscreen_mode,
      sound_enabled,
      theme
    } = req.body;

    // Validate values
    if (blur_intensity !== undefined && (blur_intensity < 0 || blur_intensity > 10)) {
      return res.status(400).json({ error: 'Blur intensity must be between 0 and 10' });
    }

    if (dim_opacity !== undefined && (dim_opacity < 0 || dim_opacity > 100)) {
      return res.status(400).json({ error: 'Dim opacity must be between 0 and 100' });
    }

    // Check if settings exist
    const [existing] = await db.query(
      'SELECT id FROM focus_settings WHERE user_id = ?',
      [userId]
    );

    if (existing.length === 0) {
      // Insert new settings
      await db.query(`
        INSERT INTO focus_settings
        (user_id, blur_intensity, dim_opacity, hide_timer, hide_score,
         hide_navigation, fullscreen_mode, sound_enabled, theme)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        blur_intensity || 5,
        dim_opacity || 70,
        hide_timer || false,
        hide_score || false,
        hide_navigation || false,
        fullscreen_mode !== undefined ? fullscreen_mode : true,
        sound_enabled || false,
        theme || 'auto'
      ]);
    } else {
      // Update existing settings
      const updates = [];
      const values = [];

      if (blur_intensity !== undefined) {
        updates.push('blur_intensity = ?');
        values.push(blur_intensity);
      }
      if (dim_opacity !== undefined) {
        updates.push('dim_opacity = ?');
        values.push(dim_opacity);
      }
      if (hide_timer !== undefined) {
        updates.push('hide_timer = ?');
        values.push(hide_timer);
      }
      if (hide_score !== undefined) {
        updates.push('hide_score = ?');
        values.push(hide_score);
      }
      if (hide_navigation !== undefined) {
        updates.push('hide_navigation = ?');
        values.push(hide_navigation);
      }
      if (fullscreen_mode !== undefined) {
        updates.push('fullscreen_mode = ?');
        values.push(fullscreen_mode);
      }
      if (sound_enabled !== undefined) {
        updates.push('sound_enabled = ?');
        values.push(sound_enabled);
      }
      if (theme !== undefined) {
        updates.push('theme = ?');
        values.push(theme);
      }

      if (updates.length > 0) {
        values.push(userId);
        await db.query(
          `UPDATE focus_settings SET ${updates.join(', ')} WHERE user_id = ?`,
          values
        );
      }
    }

    // Return updated settings
    const [updated] = await db.query(
      'SELECT * FROM focus_settings WHERE user_id = ?',
      [userId]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating focus settings:', error);
    res.status(500).json({ error: 'Failed to update focus settings' });
  }
});

// Reset focus settings to default
router.delete('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    await db.query('DELETE FROM focus_settings WHERE user_id = ?', [userId]);

    res.json({
      message: 'Settings reset to default',
      userId: userId
    });
  } catch (error) {
    console.error('Error resetting focus settings:', error);
    res.status(500).json({ error: 'Failed to reset focus settings' });
  }
});

module.exports = router;
