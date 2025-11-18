/**
 * Dancing Line Sorting Algorithms
 * Implements various sorting algorithms with step-by-step visualization
 */

class SortingAlgorithms {
    constructor() {
        this.steps = [];
        this.comparisons = 0;
        this.swaps = 0;
    }

    /**
     * Reset statistics
     */
    reset() {
        this.steps = [];
        this.comparisons = 0;
        this.swaps = 0;
    }

    /**
     * Add a step to the visualization sequence
     */
    addStep(type, data) {
        this.steps.push({
            type: type,
            data: data,
            comparisons: this.comparisons,
            swaps: this.swaps
        });
    }

    /**
     * Bubble Sort Algorithm
     * Time Complexity: O(n²)
     */
    bubbleSort(arr) {
        this.reset();
        const numbers = [...arr];
        const n = numbers.length;

        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                // Compare adjacent elements
                this.comparisons++;
                this.addStep('compare', {
                    indices: [j, j + 1],
                    array: [...numbers]
                });

                if (numbers[j] > numbers[j + 1]) {
                    // Swap elements
                    this.swaps++;
                    [numbers[j], numbers[j + 1]] = [numbers[j + 1], numbers[j]];

                    this.addStep('swap', {
                        indices: [j, j + 1],
                        array: [...numbers]
                    });
                }
            }

            // Mark the last element as sorted
            this.addStep('sorted', {
                indices: [n - i - 1],
                array: [...numbers]
            });
        }

        // Mark first element as sorted
        this.addStep('sorted', {
            indices: [0],
            array: [...numbers]
        });

        return this.steps;
    }

    /**
     * Selection Sort Algorithm
     * Time Complexity: O(n²)
     */
    selectionSort(arr) {
        this.reset();
        const numbers = [...arr];
        const n = numbers.length;

        for (let i = 0; i < n - 1; i++) {
            let minIdx = i;

            // Find minimum element in unsorted portion
            for (let j = i + 1; j < n; j++) {
                this.comparisons++;
                this.addStep('compare', {
                    indices: [minIdx, j],
                    array: [...numbers]
                });

                if (numbers[j] < numbers[minIdx]) {
                    minIdx = j;
                }
            }

            // Swap minimum element with first unsorted element
            if (minIdx !== i) {
                this.swaps++;
                [numbers[i], numbers[minIdx]] = [numbers[minIdx], numbers[i]];

                this.addStep('swap', {
                    indices: [i, minIdx],
                    array: [...numbers]
                });
            }

            // Mark element as sorted
            this.addStep('sorted', {
                indices: [i],
                array: [...numbers]
            });
        }

        // Mark last element as sorted
        this.addStep('sorted', {
            indices: [n - 1],
            array: [...numbers]
        });

        return this.steps;
    }

    /**
     * Insertion Sort Algorithm
     * Time Complexity: O(n²)
     */
    insertionSort(arr) {
        this.reset();
        const numbers = [...arr];
        const n = numbers.length;

        for (let i = 1; i < n; i++) {
            const key = numbers[i];
            let j = i - 1;

            this.addStep('compare', {
                indices: [i],
                array: [...numbers]
            });

            // Move elements greater than key one position ahead
            while (j >= 0 && numbers[j] > key) {
                this.comparisons++;
                this.addStep('compare', {
                    indices: [j, j + 1],
                    array: [...numbers]
                });

                this.swaps++;
                numbers[j + 1] = numbers[j];

                this.addStep('swap', {
                    indices: [j, j + 1],
                    array: [...numbers]
                });

                j--;
            }

            if (j >= 0) {
                this.comparisons++;
            }

            numbers[j + 1] = key;

            // Mark sorted portion
            this.addStep('sorted', {
                indices: Array.from({length: i + 1}, (_, k) => k),
                array: [...numbers]
            });
        }

        return this.steps;
    }

    /**
     * Quick Sort Algorithm
     * Time Complexity: O(n log n) average
     */
    quickSort(arr) {
        this.reset();
        const numbers = [...arr];
        this._quickSortHelper(numbers, 0, numbers.length - 1);
        return this.steps;
    }

    _quickSortHelper(arr, low, high) {
        if (low < high) {
            const pivotIdx = this._partition(arr, low, high);

            this.addStep('sorted', {
                indices: [pivotIdx],
                array: [...arr]
            });

            this._quickSortHelper(arr, low, pivotIdx - 1);
            this._quickSortHelper(arr, pivotIdx + 1, high);
        } else if (low === high) {
            this.addStep('sorted', {
                indices: [low],
                array: [...arr]
            });
        }
    }

    _partition(arr, low, high) {
        const pivot = arr[high];
        let i = low - 1;

        this.addStep('compare', {
            indices: [high],
            array: [...arr],
            message: `Pivot: ${pivot}`
        });

        for (let j = low; j < high; j++) {
            this.comparisons++;
            this.addStep('compare', {
                indices: [j, high],
                array: [...arr]
            });

            if (arr[j] < pivot) {
                i++;
                if (i !== j) {
                    this.swaps++;
                    [arr[i], arr[j]] = [arr[j], arr[i]];

                    this.addStep('swap', {
                        indices: [i, j],
                        array: [...arr]
                    });
                }
            }
        }

        if (i + 1 !== high) {
            this.swaps++;
            [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];

            this.addStep('swap', {
                indices: [i + 1, high],
                array: [...arr]
            });
        }

        return i + 1;
    }
}

// Make it available globally
if (typeof window !== 'undefined') {
    window.SortingAlgorithms = SortingAlgorithms;
}
