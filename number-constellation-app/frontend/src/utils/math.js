/**
 * Mathematical utilities for Number Constellation
 * Handles prime detection, multiple calculation, etc.
 */

const MathUtils = {
    /**
     * Check if a number is prime
     * @param {number} n
     * @returns {boolean}
     */
    isPrime(n) {
        if (n < 2) return false;
        if (n === 2) return true;
        if (n % 2 === 0) return false;

        const sqrt = Math.sqrt(n);
        for (let i = 3; i <= sqrt; i += 2) {
            if (n % i === 0) return false;
        }
        return true;
    },

    /**
     * Check if a number is a multiple of another
     * @param {number} n
     * @param {number} base
     * @returns {boolean}
     */
    isMultipleOf(n, base) {
        return n % base === 0;
    },

    /**
     * Check if a number is composite (not prime and > 1)
     * @param {number} n
     * @returns {boolean}
     */
    isComposite(n) {
        return n > 1 && !this.isPrime(n);
    },

    /**
     * Generate prime numbers in a range
     * @param {number} start
     * @param {number} end
     * @returns {number[]}
     */
    getPrimesInRange(start, end) {
        const primes = [];
        for (let i = start; i <= end; i++) {
            if (this.isPrime(i)) {
                primes.push(i);
            }
        }
        return primes;
    },

    /**
     * Generate multiples in a range
     * @param {number} base
     * @param {number} start
     * @param {number} end
     * @returns {number[]}
     */
    getMultiplesInRange(base, start, end) {
        const multiples = [];
        const first = Math.ceil(start / base) * base;
        for (let i = first; i <= end; i += base) {
            if (i >= start) {
                multiples.push(i);
            }
        }
        return multiples;
    },

    /**
     * Get Fibonacci numbers in a range
     * @param {number} start
     * @param {number} end
     * @returns {number[]}
     */
    getFibonacciInRange(start, end) {
        const fibonacci = [0, 1];
        let a = 0, b = 1;

        while (true) {
            const next = a + b;
            if (next > end) break;
            fibonacci.push(next);
            a = b;
            b = next;
        }

        return fibonacci.filter(n => n >= start && n <= end);
    },

    /**
     * Get square numbers in a range
     * @param {number} start
     * @param {number} end
     * @returns {number[]}
     */
    getSquaresInRange(start, end) {
        const squares = [];
        const sqrtStart = Math.ceil(Math.sqrt(start));
        const sqrtEnd = Math.floor(Math.sqrt(end));

        for (let i = sqrtStart; i <= sqrtEnd; i++) {
            squares.push(i * i);
        }

        return squares;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathUtils;
}
