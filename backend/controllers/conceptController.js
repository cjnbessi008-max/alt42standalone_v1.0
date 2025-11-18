// Concept Controller
// Handles HTTP requests for concept operations
const conceptService = require('../services/conceptService');

class ConceptController {
    /**
     * GET /api/concepts/:number
     * Get concept tree for a number
     */
    async getConceptTree(req, res) {
        try {
            const number = parseInt(req.params.number);
            const maxDepth = parseInt(req.query.depth) || 3;

            if (isNaN(number)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid number parameter'
                });
            }

            const tree = await conceptService.buildConceptTree(number, maxDepth);

            res.json({
                success: true,
                data: tree
            });
        } catch (error) {
            console.error('Error fetching concept tree:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch concept tree',
                message: error.message
            });
        }
    }

    /**
     * GET /api/concepts
     * Get all concepts
     */
    async getAllConcepts(req, res) {
        try {
            const concepts = await conceptService.getAllConcepts();

            res.json({
                success: true,
                data: concepts,
                count: concepts.length
            });
        } catch (error) {
            console.error('Error fetching concepts:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch concepts'
            });
        }
    }

    /**
     * POST /api/concepts/track
     * Track user interaction with concept tree
     */
    async trackInteraction(req, res) {
        try {
            const { userId, problemId, clickedNumber, conceptId, sessionId } = req.body;

            if (!clickedNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'clickedNumber is required'
                });
            }

            await conceptService.trackInteraction({
                userId,
                problemId,
                clickedNumber,
                conceptId,
                sessionId
            });

            res.json({
                success: true,
                message: 'Interaction tracked successfully'
            });
        } catch (error) {
            console.error('Error tracking interaction:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to track interaction'
            });
        }
    }
}

module.exports = new ConceptController();
