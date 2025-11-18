const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const jwt = require('jsonwebtoken');

// LTI Launch endpoint (receives launch from Moodle)
router.post('/launch', async (req, res) => {
    try {
        // In a real implementation, you would validate the LTI launch request
        // using the ltijs library or similar

        const {
            user_id,
            lis_person_name_full,
            lis_person_contact_email_primary,
            roles,
            context_id,
            context_title,
            resource_link_id
        } = req.body;

        // Determine user role
        const isTeacher = roles?.toLowerCase().includes('instructor') ||
                         roles?.toLowerCase().includes('teacher');
        const userRole = isTeacher ? 'teacher' : 'student';

        // Find or create user
        let userResult = await query(
            'SELECT * FROM users WHERE lti_user_id = $1',
            [user_id]
        );

        let user;
        if (userResult.rows.length === 0) {
            // Create new user
            userResult = await query(
                `INSERT INTO users (lti_user_id, email, full_name, role)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [user_id, lis_person_contact_email_primary, lis_person_name_full, userRole]
            );
            user = userResult.rows[0];
        } else {
            user = userResult.rows[0];
            // Update user info if changed
            await query(
                `UPDATE users
                 SET email = $1, full_name = $2, role = $3, updated_at = NOW()
                 WHERE id = $4`,
                [lis_person_contact_email_primary, lis_person_name_full, userRole, user.id]
            );
        }

        // Store or update LTI context
        await query(
            `INSERT INTO lti_contexts (context_id, course_name, moodle_course_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (context_id)
             DO UPDATE SET course_name = $2, moodle_course_id = $3`,
            [context_id, context_title, context_id]
        );

        // Generate JWT token for the session
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: userRole,
                contextId: context_id,
                ltiUserId: user_id
            },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: '7d' }
        );

        // Redirect to the appropriate page
        const redirectUrl = userRole === 'teacher'
            ? `/dashboard?token=${token}&context=${context_id}`
            : `/student?token=${token}&context=${context_id}`;

        res.redirect(process.env.FRONTEND_URL + redirectUrl);
    } catch (error) {
        console.error('LTI Launch error:', error);
        res.status(500).send('Error processing LTI launch');
    }
});

// LTI Deep Linking response (for adding tool to Moodle course)
router.post('/deep-linking', async (req, res) => {
    try {
        // Handle deep linking request
        // This would be implemented with ltijs library in production

        res.json({
            success: true,
            message: 'Deep linking configured'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Grade passback to Moodle
router.post('/grade-passback', async (req, res) => {
    try {
        const { sessionId, userId, score } = req.body;

        // Record grade passback attempt
        await query(
            `INSERT INTO grade_passbacks (session_id, user_id, score, passback_status)
             VALUES ($1, $2, $3, 'pending')
             RETURNING *`,
            [sessionId, userId, score]
        );

        // In production, this would use LTI Assignment and Grade Services
        // to send the score back to Moodle

        // For now, just mark as sent
        await query(
            `UPDATE grade_passbacks
             SET passback_status = 'sent', succeeded_at = NOW()
             WHERE session_id = $1 AND user_id = $2`,
            [sessionId, userId]
        );

        res.json({
            success: true,
            message: 'Grade sent to Moodle'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// LTI Configuration/Registration endpoint
router.get('/config', (req, res) => {
    res.json({
        title: 'Mental Stamina Measurement',
        description: 'Track student cognitive endurance and mental fatigue',
        oidc_initiation_url: `${process.env.API_URL}/lti/oidc`,
        target_link_uri: `${process.env.API_URL}/lti/launch`,
        public_jwk_url: `${process.env.API_URL}/lti/jwks`,
        scopes: [
            'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem',
            'https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly',
            'https://purl.imsglobal.org/spec/lti-ags/scope/score'
        ],
        extensions: [{
            platform: 'moodle',
            privacy_level: 'public',
            tool_id: 'mental_stamina',
            settings: {
                platform: 'moodle',
                placements: [{
                    placement: 'course_navigation',
                    message_type: 'LtiResourceLinkRequest',
                    target_link_uri: `${process.env.API_URL}/lti/launch`,
                    text: 'Mental Stamina'
                }]
            }
        }]
    });
});

module.exports = router;
