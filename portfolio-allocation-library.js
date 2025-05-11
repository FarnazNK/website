/**
 * portfolio-allocation.js
 * A simplified implementation of portfolio allocation methods for Farnaz Nasehi's Quantitative Investment Platform
 * 
 * This library provides implementation for the following optimization methods:
 * - Mean-Variance Optimization (Markowitz Portfolio Theory)
 * - Minimum Variance Portfolio
 * 
 * Usage:
 * 1. Add this script to your website
 * 2. Access methods through the global PortfolioAllocation object
 */

// Define the PortfolioAllocation namespace
window.PortfolioAllocation = (function() {
    /**
     * Find the optimal portfolio weights using mean-variance optimization
     * (Markowitz Portfolio Theory)
     * 
     * @param {Array} meanReturns - Array of expected returns for each asset
     * @param {Array} covMatrix - Covariance matrix (2D array)
     * @param {Object} options - Optional parameters
     * @param {number} options.riskFreeRate - Risk-free rate (default: 0)
     * @param {number} options.targetReturn - Target return (optional)
     * @returns {Array} Optimal weights for each asset
     */
    function meanVarianceOptimizationWeights(meanReturns, covMatrix, options = {}) {
        const n = meanReturns.length;
        const riskFreeRate = options.riskFreeRate || 0;
        
        // Validate inputs
        if (n === 0) {
            throw new Error("Mean returns array cannot be empty");
        }
        if (covMatrix.length !== n || covMatrix[0].length !== n) {
            throw new Error("Covariance matrix dimensions must match the number of assets");
        }
        
        // For simplicity in this implementation, we'll use the maximum Sharpe ratio approach
        // which is a special case of the mean-variance optimization
        
        // Calculate inverse of covariance matrix
        const invCov = matrixInverse(covMatrix);
        if (!invCov) {
            // If matrix inversion fails, return equal weights
            return Array(n).fill(1/n);
        }
        
        // Calculate excess returns (asset returns - risk-free rate)
        const excessReturns = meanReturns.map(r => r - riskFreeRate);
        
        // Calculate weights that maximize Sharpe ratio
        const ones = Array(n).fill(1);
        
        // Calculate components for the formula
        const A = matrixVectorMultiply(invCov, excessReturns);
        const B = matrixVectorMultiply(invCov, ones);
        const C = matrixVectorMultiply(excessReturns, A);
        const D = matrixVectorMultiply(ones, B);
        const E = matrixVectorMultiply(ones, A);
        
        let weights;
        if (options.targetReturn) {
            // If target return is specified, find weights that minimize variance for that return
            const targetExcessReturn = options.targetReturn - riskFreeRate;
            const lambda1 = (D * targetExcessReturn - E) / (C * D - E * E);
            const lambda2 = (C - E * targetExcessReturn) / (C * D - E * E);
            
            // Calculate weights
            weights = [];
            for (let i = 0; i < n; i++) {
                let weight = 0;
                for (let j = 0; j < n; j++) {
                    weight += invCov[i][j] * (lambda1 * excessReturns[j] + lambda2);
                }
                weights.push(weight);
            }
        } else {
            // Otherwise maximize Sharpe ratio
            weights = A.map(a_i => a_i / vectorSum(A));
        }
        
        // Normalize weights to ensure they sum to 1
        const weightSum = vectorSum(weights);
        return weights.map(w => w / weightSum);
    }
    
    /**
     * Calculate the minimum variance portfolio
     * 
     * @param {Array} covMatrix - Covariance matrix (2D array)
     * @returns {Array} Optimal weights for minimum variance
     */
    function minimumVarianceWeights(covMatrix) {
        const n = covMatrix.length;
        
        // Validate input
        if (n === 0 || covMatrix[0].length !== n) {
            throw new Error("Invalid covariance matrix dimensions");
        }
        
        // Calculate inverse of covariance matrix
        const invCov = matrixInverse(covMatrix);
        if (!invCov) {
            // If matrix inversion fails, return equal weights
            return Array(n).fill(1/n);
        }
        
        // For minimum variance, weights = (Σ^-1 * 1) / (1^T * Σ^-1 * 1)
        const ones = Array(n).fill(1);
        const numerator = matrixVectorMultiply(invCov, ones);
        const denominator = vectorSum(numerator);
        
        // Calculate weights
        return numerator.map(num => num / denominator);
    }
    
    /**
     * Matrix-vector multiplication
     * 
     * @param {Array} matrix - 2D array representing a matrix
     * @param {Array} vector - 1D array
     * @returns {Array} Resulting vector
     */
    function matrixVectorMultiply(matrix, vector) {
        // Handle case where matrix is a vector and vector is a scalar
        if (!Array.isArray(matrix[0])) {
            return vector * vectorDot(matrix, matrix);
        }
        
        const result = [];
        const n = matrix.length;
        const m = vector.length;
        
        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let j = 0; j < m; j++) {
                sum += matrix[i][j] * vector[j];
            }
            result.push(sum);
        }
        
        return result;
    }
    
    /**
     * Vector dot product
     * 
     * @param {Array} v1 - First vector
     * @param {Array} v2 - Second vector
     * @returns {number} Dot product
     */
    function vectorDot(v1, v2) {
        return v1.reduce((sum, x, i) => sum + x * v2[i], 0);
    }
    
    /**
     * Sum of all elements in a vector
     * 
     * @param {Array} vector - Input vector
     * @returns {number} Sum of elements
     */
    function vectorSum(vector) {
        return vector.reduce((sum, x) => sum + x, 0);
    }
    
    /**
     * Matrix inversion using Gauss-Jordan elimination
     * 
     * @param {Array} matrix - Input matrix (2D array)
     * @returns {Array} Inverse matrix or null if not invertible
     */
    function matrixInverse(matrix) {
        const n = matrix.length;
        
        // Create augmented matrix [A|I]
        const augmented = [];
        for (let i = 0; i < n; i++) {
            augmented[i] = [];
            for (let j = 0; j < n; j++) {
                augmented[i][j] = matrix[i][j];
            }
            for (let j = 0; j < n; j++) {
                augmented[i][n + j] = (i === j) ? 1 : 0;
            }
        }
        
        // Perform Gauss-Jordan elimination
        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxRow = i;
            for (let j = i + 1; j < n; j++) {
                if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
                    maxRow = j;
                }
            }
            
            // Swap rows if needed
            if (maxRow !== i) {
                [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
            }
            
            // Check if matrix is invertible
            if (Math.abs(augmented[i][i]) < 1e-10) {
                return null; // Matrix is not invertible
            }
            
            // Scale pivot row
            const pivot = augmented[i][i];
            for (let j = 0; j < 2 * n; j++) {
                augmented[i][j] /= pivot;
            }
            
            // Eliminate other rows
            for (let j = 0; j < n; j++) {
                if (j !== i) {
                    const factor = augmented[j][i];
                    for (let k = 0; k < 2 * n; k++) {
                        augmented[j][k] -= factor * augmented[i][k];
                    }
                }
            }
        }
        
        // Extract inverse matrix
        const inverse = [];
        for (let i = 0; i < n; i++) {
            inverse[i] = augmented[i].slice(n, 2 * n);
        }
        
        return inverse;
    }
    
    // Public API
    return {
        meanVarianceOptimizationWeights,
        minimumVarianceWeights
    };
})();
