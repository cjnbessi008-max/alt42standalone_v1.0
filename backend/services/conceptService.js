// Concept Tree Service
// Handles concept retrieval and tree building
const { query } = require('../config/database');

class ConceptService {
    /**
     * Get concepts for a specific number
     * @param {number} number - The number to get concepts for
     * @returns {Promise<array>} Array of concepts
     */
    async getConceptsByNumber(number) {
        const sql = `
            SELECT
                id,
                number,
                concept_name,
                description,
                level,
                created_at
            FROM concepts
            WHERE number = ?
            ORDER BY level ASC
        `;

        return await query(sql, [number]);
    }

    /**
     * Get child concepts (related concepts) for a concept
     * @param {number} conceptId - Parent concept ID
     * @returns {Promise<array>} Array of child concepts
     */
    async getChildConcepts(conceptId) {
        const sql = `
            SELECT
                c.id,
                c.number,
                c.concept_name,
                c.description,
                c.level,
                cr.relationship_type,
                cr.weight
            FROM concepts c
            INNER JOIN concept_relationships cr ON c.id = cr.child_concept_id
            WHERE cr.parent_concept_id = ?
            ORDER BY cr.weight DESC, c.level ASC
        `;

        return await query(sql, [conceptId]);
    }

    /**
     * Build a complete concept tree for a number
     * @param {number} number - The number to build tree for
     * @param {number} maxDepth - Maximum tree depth (default 3)
     * @returns {Promise<object>} Tree structure
     */
    async buildConceptTree(number, maxDepth = 3) {
        const rootConcepts = await this.getConceptsByNumber(number);

        if (rootConcepts.length === 0) {
            return {
                number: number,
                concepts: [],
                message: 'No concepts found for this number'
            };
        }

        // Build tree recursively
        const tree = {
            number: number,
            concepts: []
        };

        for (const concept of rootConcepts) {
            const conceptNode = {
                id: concept.id,
                name: concept.concept_name,
                description: concept.description,
                level: concept.level,
                children: []
            };

            if (maxDepth > 1) {
                conceptNode.children = await this.buildChildTree(concept.id, maxDepth - 1);
            }

            tree.concepts.push(conceptNode);
        }

        return tree;
    }

    /**
     * Recursively build child tree
     * @param {number} conceptId - Parent concept ID
     * @param {number} depth - Remaining depth
     * @returns {Promise<array>} Array of child nodes
     */
    async buildChildTree(conceptId, depth) {
        if (depth <= 0) return [];

        const children = await this.getChildConcepts(conceptId);
        const childNodes = [];

        for (const child of children) {
            const childNode = {
                id: child.id,
                name: child.concept_name,
                description: child.description,
                level: child.level,
                relationshipType: child.relationship_type,
                weight: parseFloat(child.weight),
                children: []
            };

            if (depth > 1) {
                childNode.children = await this.buildChildTree(child.id, depth - 1);
            }

            childNodes.push(childNode);
        }

        return childNodes;
    }

    /**
     * Get all concepts with their relationships
     * @returns {Promise<array>} All concepts
     */
    async getAllConcepts() {
        const sql = 'SELECT * FROM concepts ORDER BY number ASC, level ASC';
        return await query(sql);
    }

    /**
     * Track user interaction
     * @param {object} interaction - Interaction data
     * @returns {Promise} Insert result
     */
    async trackInteraction(interaction) {
        const sql = `
            INSERT INTO user_interactions
            (user_id, problem_id, clicked_number, concept_id, session_id)
            VALUES (?, ?, ?, ?, ?)
        `;

        return await query(sql, [
            interaction.userId || null,
            interaction.problemId || null,
            interaction.clickedNumber,
            interaction.conceptId || null,
            interaction.sessionId || null
        ]);
    }
}

module.exports = new ConceptService();
