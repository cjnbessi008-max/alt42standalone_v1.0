<?php
/**
 * Function Digest Generator
 * Generates 3-line summaries of functions
 */

class FunctionDigestGenerator {

    /**
     * Generate a 3-line digest for a function
     * In production, this could use AI/LLM API for better summaries
     */
    public function generateDigest($functionName, $functionCode, $language = 'python') {
        // Simple rule-based generation
        // In production, integrate with Claude API or similar

        $digest = [
            'line1' => $this->generatePurposeLine($functionName, $functionCode),
            'line2' => $this->generateParametersLine($functionName, $functionCode, $language),
            'line3' => $this->generateBehaviorLine($functionName, $functionCode)
        ];

        return $digest;
    }

    /**
     * Line 1: Function purpose
     */
    private function generatePurposeLine($functionName, $code) {
        // Extract docstring if available
        if (preg_match('/"""(.*?)"""/s', $code, $matches) ||
            preg_match("/'''(.*?)'''/s", $code, $matches)) {
            $docstring = trim($matches[1]);
            $firstLine = explode("\n", $docstring)[0];
            return "📋 " . ucfirst(trim($firstLine));
        }

        // Generate from function name
        $readable = preg_replace('/[_-]+/', ' ', $functionName);
        return "📋 " . ucfirst($readable);
    }

    /**
     * Line 2: Parameters and return type
     */
    private function generateParametersLine($functionName, $code, $language) {
        if ($language === 'python') {
            // Extract function signature
            if (preg_match('/def\s+' . preg_quote($functionName) . '\s*\((.*?)\)(?:\s*->\s*([^:]+))?:/s', $code, $matches)) {
                $params = trim($matches[1]);
                $returnType = isset($matches[2]) ? trim($matches[2]) : 'Any';

                if (empty($params)) {
                    return "📥 No parameters → Returns: " . $returnType;
                }

                return "📥 Parameters: " . $params . " → Returns: " . $returnType;
            }
        }

        return "📥 Check function signature for parameters";
    }

    /**
     * Line 3: Key behavior or example
     */
    private function generateBehaviorLine($functionName, $code) {
        // Check for recursion
        if (preg_match('/\b' . preg_quote($functionName) . '\s*\(/', $code)) {
            return "🔄 Uses recursion - watch for base case";
        }

        // Check for loops
        if (preg_match('/\b(for|while)\b/', $code)) {
            return "🔁 Contains loops - iterative approach";
        }

        // Check for return statement
        if (preg_match('/return\s+(.+)/', $code, $matches)) {
            $returnExpr = trim($matches[1]);
            if (strlen($returnExpr) < 50) {
                return "↩️  Returns: " . $returnExpr;
            }
        }

        return "💡 Review implementation for details";
    }

    /**
     * Generate digest with emojis for better readability
     */
    public function generateEnhancedDigest($functionName, $functionCode, $questionContext = '', $language = 'python') {
        $basic = $this->generateDigest($functionName, $functionCode, $language);

        // Enhance based on context
        if (stripos($questionContext, 'fibonacci') !== false) {
            $basic['line3'] = "⚠️ Exponential time O(2^n) - consider memoization";
        } elseif (stripos($questionContext, 'factorial') !== false) {
            $basic['line3'] = "📈 Linear time O(n) - simple recursive pattern";
        } elseif (stripos($functionName, 'sort') !== false) {
            $basic['line3'] = "⏱️ Check time complexity (O(n log n) expected)";
        }

        return $basic;
    }
}
