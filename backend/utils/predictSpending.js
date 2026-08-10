const ss = require('simple-statistics');

/**
 * Predicts next month's spending using linear regression over past monthly totals.
 * Falls back to a simple moving average when there isn't enough data for a
 * reliable trend line (regression needs at least 3 points to be meaningful).
 *
 * @param {Array<{ month: string, total: number }>} monthlyTotals - sorted oldest -> newest
 * @returns {{ predictedAmount: number, trend: 'up'|'down'|'stable', method: string, confidence: string }}
 */
function predictNextMonthSpending(monthlyTotals) {
  if (!monthlyTotals || monthlyTotals.length === 0) {
    return { predictedAmount: 0, trend: 'stable', method: 'none', confidence: 'low' };
  }

  if (monthlyTotals.length === 1) {
    return {
      predictedAmount: Math.round(monthlyTotals[0].total),
      trend: 'stable',
      method: 'single-data-point',
      confidence: 'low',
    };
  }

  if (monthlyTotals.length === 2) {
    const [a, b] = monthlyTotals;
    const avg = (a.total + b.total) / 2;
    const trend = b.total > a.total ? 'up' : b.total < a.total ? 'down' : 'stable';
    return { predictedAmount: Math.round(avg), trend, method: 'moving-average', confidence: 'low' };
  }

  // Linear regression: x = month index (0,1,2...), y = total spent
  const points = monthlyTotals.map((m, idx) => [idx, m.total]);
  const regression = ss.linearRegression(points);
  const regressionLine = ss.linearRegressionLine(regression);
  const nextX = monthlyTotals.length; // predict the next index
  const predicted = regressionLine(nextX);

  // R-squared tells us how well the line fits -> maps to a confidence label
  const rSquared = ss.rSquared(points, regressionLine);
  const confidence = rSquared > 0.6 ? 'high' : rSquared > 0.3 ? 'medium' : 'low';

  const trend = regression.m > 5 ? 'up' : regression.m < -5 ? 'down' : 'stable';

  return {
    predictedAmount: Math.max(0, Math.round(predicted)),
    trend,
    method: 'linear-regression',
    confidence,
    rSquared: Math.round(rSquared * 100) / 100,
  };
}

/**
 * Detects anomalous/unusually high category spending compared to the user's
 * own historical average for that category, using a simple z-score check.
 */
function detectAnomalies(categoryHistory) {
  // categoryHistory: [{ category, amounts: [num, num, ...] }]
  const anomalies = [];
  for (const cat of categoryHistory) {
    if (cat.amounts.length < 3) continue;
    const mean = ss.mean(cat.amounts);
    const stdDev = ss.standardDeviation(cat.amounts);
    const latest = cat.amounts[cat.amounts.length - 1];
    if (stdDev > 0) {
      const zScore = (latest - mean) / stdDev;
      if (zScore > 1.5) {
        anomalies.push({
          category: cat.category,
          latest,
          average: Math.round(mean),
          message: `${cat.category} spending is unusually high this month (${Math.round(
            zScore * 10
          ) / 10}x above your normal pattern)`,
        });
      }
    }
  }
  return anomalies;
}

module.exports = { predictNextMonthSpending, detectAnomalies };
