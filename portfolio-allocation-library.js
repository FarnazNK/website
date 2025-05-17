/**
 * portfolio-allocation.js
 *
 * A robust library for portfolio optimization, providing:
 * - Mean-Variance Optimization (Markowitz Portfolio Theory)
 * - Minimum Variance Portfolio
 * - Risk Parity Portfolio
 * - Portfolio statistics and risk contributions
 *
 * Usage:
 * 1. Include this script in your HTML after dependencies.
 * 2. Access methods via the global PortfolioAllocation object.
 *
 * Dependencies: None (self-contained matrix operations)
 */

/* eslint-disable no-param-reassign */
window.PortfolioAllocation = (() => {
  /**
   * Compute mean returns from historical return series
   * @param {number[][]} returnsData - Array of return series for each asset
   * @returns {number[]} Mean returns
   */
  const computeMeanReturns = (returnsData) => {
    return returnsData.map((returns) => {
      const validReturns = returns.filter((r) => !Number.isNaN(r) && Number.isFinite(r));
      return validReturns.length > 0 ? validReturns.reduce((sum, r) => sum + r, 0) / validReturns.length : 0;
    });
  };

  /**
   * Compute covariance matrix from historical return series
   * @param {number[][]} returnsData - Array of return series for each asset
   * @returns {number[][]} Covariance matrix
   */
  const computeCovMatrix = (returnsData) => {
    const n = returnsData.length;
    const length = Math.min(...returnsData.map((r) => r.length));
    if (length < 2) throw new Error('Insufficient data points for covariance calculation');

    const means = computeMeanReturns(returnsData);
    const covMatrix = Array(n)
      .fill()
      .map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        let cov = 0;
        let count = 0;
        for (let t = 0; t < length; t++) {
          if (
            Number.isFinite(returnsData[i][t]) &&
            Number.isFinite(returnsData[j][t]) &&
            !Number.isNaN(returnsData[i][t]) &&
            !Number.isNaN(returnsData[j][t])
          ) {
            cov += (returnsData[i][t] - means[i]) * (returnsData[j][t] - means[j]);
            count++;
          }
        }
        covMatrix[i][j] = covMatrix[j][i] = count > 1 ? cov / (count - 1) : 0;
      }
    }
    return covMatrix;
  };

  /**
   * Mean-Variance Optimization (Markowitz Portfolio Theory)
   * @param {number[][]} returnsData - Array of return series for each asset
   * @param {Object} options - Optimization options
   * @param {number} [options.riskFreeRate=0] - Risk-free rate
   * @param {number} [options.targetReturn] - Target portfolio return
   * @param {boolean} [options.allowNegativeWeights=true] - Allow short positions
   * @param {number[]} [options.transactionCosts] - Transaction costs per asset
   * @param {number[]} [options.minWeights] - Minimum weight per asset
   * @param {number[]} [options.maxWeights] - Maximum weight per asset
   * @returns {number[]} Optimal weights
   */
  function meanVarianceOptimizationWeights(returnsData, options = {}) {
    const n = returnsData.length;
    if (n === 0) throw new Error('Returns data cannot be empty');

    const riskFreeRate = options.riskFreeRate ?? 0;
    const allowNegativeWeights = options.allowNegativeWeights !== false;
    const transactionCosts = options.transactionCosts ?? Array(n).fill(0);
    const minWeights = options.minWeights ?? Array(n).fill(allowNegativeWeights ? -Infinity : 0);
    const maxWeights = options.maxWeights ?? Array(n).fill(Infinity);

    // Validate inputs
    if (transactionCosts.length !== n || minWeights.length !== n || maxWeights.length !== n) {
      throw new Error('Input arrays must match the number of assets');
    }
    if (minWeights.some((min, i) => min > maxWeights[i])) {
      throw new Error('Minimum weights cannot exceed maximum weights');
    }

    const meanReturns = computeMeanReturns(returnsData);
    let covMatrix = computeCovMatrix(returnsData);

    // Regularize covariance matrix for stability
    const lambda = 1e-6;
    for (let i = 0; i < n; i++) {
      covMatrix[i][i] += lambda;
    }

    const invCov = matrixInverse(covMatrix);
    if (!invCov) return Array(n).fill(1 / n); // Fallback to equal weights

    // Adjust returns for transaction costs
    const adjustedReturns = meanReturns.map((r, i) => r - transactionCosts[i]);
    const excessReturns = adjustedReturns.map((r) => r - riskFreeRate);

    const ones = Array(n).fill(1);
    const A = matrixVectorMultiply(invCov, excessReturns);
    const B = matrixVectorMultiply(invCov, ones);
    const C = vectorDot(excessReturns, A);
    const D = vectorDot(ones, B);
    const E = vectorDot(ones, A);

    let weights;
    if (options.targetReturn !== undefined) {
      const targetExcessReturn = options.targetReturn - riskFreeRate;
      const lambda1 = (D * targetExcessReturn - E) / (C * D - E * E);
      const lambda2 = (C - E * targetExcessReturn) / (C * D - E * E);

      weights = Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          weights[i] += invCov[i][j] * (lambda1 * excessReturns[j] + lambda2);
        }
      }
    } else {
      weights = A.map((a) => a / vectorSum(A));
    }

    // Apply weight constraints
    weights = projectWeights(weights, minWeights, maxWeights);

    // Normalize and enforce negative weight constraints
    let weightSum = vectorSum(weights);
    if (weightSum === 0) return Array(n).fill(1 / n); // Fallback
    weights = weights.map((w) => w / weightSum);

    if (!allowNegativeWeights) {
      weights = weights.map((w) => Math.max(0, w));
      weightSum = vectorSum(weights);
      weights = weights.map((w) => (weightSum > 0 ? w / weightSum : 1 / n));
    }

    return weights;
  }

  /**
   * Minimum Variance Portfolio
   * @param {number[][]} returnsData - Array of return series for each asset
   * @param {Object} options - Optimization options
   * @param {boolean} [options.allowNegativeWeights=true] - Allow short positions
   * @param {number[]} [options.minWeights] - Minimum weight per asset
   * @param {number[]} [options.maxWeights] - Maximum weight per asset
   * @returns {number[]} Optimal weights
   */
  function minimumVarianceWeights(returnsData, options = {}) {
    const n = returnsData.length;
    if (n === 0) throw new Error('Returns data cannot be empty');

    const allowNegativeWeights = options.allowNegativeWeights !== false;
    const minWeights = options.minWeights ?? Array(n).fill(allowNegativeWeights ? -Infinity : 0);
    const maxWeights = options.maxWeights ?? Array(n).fill(Infinity);

    let covMatrix = computeCovMatrix(returnsData);
    const lambda = 1e-6;
    for (let i = 0; i < n; i++) {
      covMatrix[i][i] += lambda;
    }

    const invCov = matrixInverse(covMatrix);
    if (!invCov) return Array(n).fill(1 / n);

    const ones = Array(n).fill(1);
    const numerator = matrixVectorMultiply(invCov, ones);
    const denominator = vectorSum(numerator);

    let weights = numerator.map((num) => num / denominator);
    weights = projectWeights(weights, minWeights, maxWeights);

    if (!allowNegativeWeights) {
      weights = weights.map((w) => Math.max(0, w));
      const newSum = vectorSum(weights);
      weights = weights.map((w) => (newSum > 0 ? w / newSum : 1 / n));
    }

    return weights;
  }

  /**
   * Risk Parity Portfolio
   * @param {number[][]} returnsData - Array of return series for each asset
   * @param {Object} options - Optimization options
   * @param {boolean} [options.allowNegativeWeights=true] - Allow short positions
   * @param {number} [options.maxIterations=1000] - Maximum iterations
   * @param {number} [options.tolerance=1e-6] - Convergence tolerance
   * @returns {number[]} Optimal weights
   */
  function riskParityWeights(returnsData, options = {}) {
    const n = returnsData.length;
    if (n === 0) throw new Error('Returns data cannot be empty');

    const allowNegativeWeights = options.allowNegativeWeights !== false;
    const maxIterations = options.maxIterations ?? 1000;
    const tolerance = options.tolerance ?? 1e-6;

    let covMatrix = computeCovMatrix(returnsData);
    const lambda = 1e-6;
    for (let i = 0; i < n; i++) {
      covMatrix[i][i] += lambda;
    }

    let weights = Array(n).fill(1 / n);
    const targetRisk = 1 / n;

    // Newton-Raphson optimization
    for (let iter = 0; iter < maxIterations; iter++) {
      const oldWeights = [...weights];
      const portfolioVolatility = calculatePortfolioVolatility(weights, covMatrix);

      // Compute marginal risk contributions
      const marginalRisks = Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          marginalRisks[i] += weights[j] * covMatrix[i][j];
        }
        marginalRisks[i] *= weights[i] / portfolioVolatility;
      }

      // Compute gradient and Hessian
      const gradient = marginalRisks.map((risk) => risk - targetRisk);
      const hessian = Array(n)
        .fill()
        .map(() => Array(n).fill(0));

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          let term = covMatrix[i][j] / portfolioVolatility;
          if (i === j) {
            term -=
              (weights[i] *
                marginalRisks[i] *
                vectorDot(weights, matrixVectorMultiply(covMatrix, weights))) /
              (portfolioVolatility * portfolioVolatility);
          }
          hessian[i][j] = term;
        }
      }

      // Update weights
      const invHessian = matrixInverse(hessian);
      if (!invHessian) break;
      const deltaWeights = matrixVectorMultiply(invHessian, gradient);
      weights = weights.map((w, i) => w - deltaWeights[i]);

      if (!allowNegativeWeights) {
        weights = weights.map((w) => Math.max(0, w));
      }

      const weightSum = vectorSum(weights);
      weights = weights.map((w) => (weightSum > 0 ? w / weightSum : 1 / n));

      if (Math.max(...weights.map((w, i) => Math.abs(w - oldWeights[i]))) < tolerance) {
        break;
      }
    }

    return weights;
  }

  /**
   * Calculate portfolio statistics
   * @param {number[][]} returnsData - Array of return series for each asset
   * @param {number[]} weights - Portfolio weights
   * @param {Object} options - Options
   * @param {number} [options.riskFreeRate=0] - Risk-free rate
   * @param {number[]} [options.transactionCosts] - Transaction costs per asset
   * @returns {Object} {expectedReturn, volatility, sharpeRatio, riskContributions}
   */
  function calculatePortfolioStats(returnsData, weights, options = {}) {
    const n = returnsData.length;
    if (n === 0 || weights.length !== n) {
      throw new Error('Invalid input dimensions');
    }

    const riskFreeRate = options.riskFreeRate ?? 0;
    const transactionCosts = options.transactionCosts ?? Array(n).fill(0);

    const meanReturns = computeMeanReturns(returnsData);
    const covMatrix = computeCovMatrix(returnsData);

    const adjustedReturns = meanReturns.map((r, i) => r - transactionCosts[i]);
    const expectedReturn = vectorDot(weights, adjustedReturns);
    const volatility = calculatePortfolioVolatility(weights, covMatrix);
    const sharpeRatio = volatility > 0 ? (expectedReturn - riskFreeRate) / volatility : 0;

    // Calculate risk contributions
    const riskContributions = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        riskContributions[i] += weights[j] * covMatrix[i][j];
      }
      riskContributions[i] *= weights[i] / (volatility || 1);
    }

    return {
      expectedReturn,
      volatility,
      sharpeRatio,
      riskContributions,
    };
  }

  /**
   * Calculate portfolio volatility
   * @param {number[]} weights - Portfolio weights
   * @param {number[][]} covMatrix - Covariance matrix
   * @returns {number} Portfolio volatility
   */
  function calculatePortfolioVolatility(weights, covMatrix) {
    let variance = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        variance += weights[i] * weights[j] * covMatrix[i][j];
      }
    }
    return Math.sqrt(Math.max(0, variance));
  }

  /**
   * Project weights onto constraint set
   * @param {number[]} weights - Initial weights
   * @param {number[]} minWeights - Minimum weights
   * @param {number[]} maxWeights - Maximum weights
   * @returns {number[]} Constrained weights
   */
  function projectWeights(weights, minWeights, maxWeights) {
    return weights.map((w, i) => Math.min(Math.max(w, minWeights[i]), maxWeights[i]));
  }

  /**
   * Matrix-vector multiplication
   * @param {number[][]} matrix - Matrix
   * @param {number[]} vector - Vector
   * @returns {number[]} Result
   */
  function matrixVectorMultiply(matrix, vector) {
    return matrix.map((row) => vectorDot(row, vector));
  }

  /**
   * Vector dot product
   * @param {number[]} v1 - First vector
   * @param {number[]} v2 - Second vector
   * @returns {number} Dot product
   */
  function vectorDot(v1, v2) {
    return v1.reduce((sum, x, i) => sum + x * v2[i], 0);
  }

  /**
   * Sum of vector elements
   * @param {number[]} vector - Input vector
   * @returns {number} Sum
   */
  function vectorSum(vector) {
    return vector.reduce((sum, x) => sum + x, 0);
  }

  /**
   * Matrix inversion using Gauss-Jordan elimination
   * @param {number[][]} matrix - Input matrix
   * @returns {number[][]|null} Inverse matrix or null if not invertible
   */
  function matrixInverse(matrix) {
    const n = matrix.length;
    const augmented = matrix.map((row, i) =>
      [...row, ...Array(n).fill(0).map((_, j) => (i === j ? 1 : 0))],
    );

    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = j;
        }
      }

      if (maxRow !== i) {
        [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      }

      if (Math.abs(augmented[i][i]) < 1e-10) return null;

      const pivot = augmented[i][i];
      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= pivot;
      }

      for (let j = 0; j < n; j++) {
        if (j !== i) {
          const factor = augmented[j][i];
          for (let k = 0; k < 2 * n; k++) {
            augmented[j][k] -= factor * augmented[i][k];
          }
        }
      }
    }

    return augmented.map((row) => row.slice(n));
  }

  return {
    meanVarianceOptimizationWeights,
    minimumVarianceWeights,
    riskParityWeights,
    calculatePortfolioStats,
  };
})();