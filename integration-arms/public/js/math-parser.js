/**
 * Math Parser
 * Simple LaTeX expression parser
 */

class MathParser {
    constructor() {
        this.patterns = {
            integral: /\\int\s*/g,
            derivative: /\\frac\{d\}\{dx\}/g,
            power: /\^(\d+|\{[^}]+\})/g,
            functions: {
                sin: /\\sin\(([^)]+)\)/g,
                cos: /\\cos\(([^)]+)\)/g,
                tan: /\\tan\(([^)]+)\)/g,
                ln: /\\ln\(([^)]+)\)/g,
                log: /\\log\(([^)]+)\)/g,
            }
        };
    }

    /**
     * Parse LaTeX expression
     */
    parse(latex) {
        return {
            original: latex,
            cleaned: this.clean(latex),
            terms: this.extractTerms(latex),
            type: this.detectType(latex)
        };
    }

    /**
     * Clean LaTeX expression
     */
    clean(latex) {
        return latex
            .replace(/\\int/g, '∫')
            .replace(/\\cdot/g, '·')
            .replace(/\\,/g, ' ')
            .replace(/\{|\}/g, '')
            .trim();
    }

    /**
     * Extract terms
     */
    extractTerms(latex) {
        const terms = [];
        const cleaned = latex.replace(/\\int|dx/g, '').trim();

        // Match polynomials
        const polyMatch = cleaned.match(/x(\^\d+)?/g);
        if (polyMatch) terms.push(...polyMatch);

        // Match trig functions
        const trigMatch = cleaned.match(/\\(sin|cos|tan)\(x\)/g);
        if (trigMatch) terms.push(...trigMatch);

        // Match exponentials
        const expMatch = cleaned.match(/e\^x/g);
        if (expMatch) terms.push(...expMatch);

        // Match logarithms
        const logMatch = cleaned.match(/\\ln\(x\)/g);
        if (logMatch) terms.push(...logMatch);

        return [...new Set(terms)];
    }

    /**
     * Detect problem type
     */
    detectType(latex) {
        if (latex.includes('\\ln')) return 'logarithmic';
        if (latex.includes('\\arcsin') || latex.includes('\\arccos')) return 'inverse_trig';
        if (latex.includes('e^')) return 'exponential';
        if (latex.includes('\\sin') || latex.includes('\\cos')) return 'trigonometric';
        if (latex.match(/x\^\d+/)) return 'polynomial';
        return 'simple';
    }
}
