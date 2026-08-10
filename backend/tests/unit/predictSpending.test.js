const { predictNextMonthSpending, detectAnomalies } = require('../../utils/predictSpending');

describe('predictNextMonthSpending', () => {
  test('returns zero prediction for empty history', () => {
    const result = predictNextMonthSpending([]);
    expect(result.predictedAmount).toBe(0);
    expect(result.method).toBe('none');
  });

  test('uses the single data point directly when only one month of history exists', () => {
    const result = predictNextMonthSpending([{ month: '2026-06', total: 5000 }]);
    expect(result.predictedAmount).toBe(5000);
    expect(result.method).toBe('single-data-point');
  });

  test('uses a moving average for exactly two months of history', () => {
    const result = predictNextMonthSpending([
      { month: '2026-06', total: 4000 },
      { month: '2026-07', total: 6000 },
    ]);
    expect(result.predictedAmount).toBe(5000);
    expect(result.trend).toBe('up');
  });

  test('detects a clear rising trend with high confidence via linear regression', () => {
    const result = predictNextMonthSpending([
      { month: '2026-03', total: 8000 },
      { month: '2026-04', total: 9200 },
      { month: '2026-05', total: 10100 },
      { month: '2026-06', total: 11500 },
      { month: '2026-07', total: 12800 },
    ]);
    expect(result.trend).toBe('up');
    expect(result.method).toBe('linear-regression');
    expect(result.confidence).toBe('high');
    expect(result.predictedAmount).toBeGreaterThan(12800); // should extrapolate further up
  });

  test('detects a falling trend', () => {
    const result = predictNextMonthSpending([
      { month: '2026-03', total: 15000 },
      { month: '2026-04', total: 13000 },
      { month: '2026-05', total: 11000 },
      { month: '2026-06', total: 9000 },
    ]);
    expect(result.trend).toBe('down');
    expect(result.predictedAmount).toBeLessThan(9000);
  });

  test('never predicts a negative amount even with a steep downward trend', () => {
    const result = predictNextMonthSpending([
      { month: '2026-01', total: 3000 },
      { month: '2026-02', total: 1000 },
      { month: '2026-03', total: 100 },
    ]);
    expect(result.predictedAmount).toBeGreaterThanOrEqual(0);
  });

  test('detects a stable trend when spending barely changes', () => {
    const result = predictNextMonthSpending([
      { month: '2026-04', total: 5000 },
      { month: '2026-05', total: 5020 },
      { month: '2026-06', total: 4990 },
      { month: '2026-07', total: 5010 },
    ]);
    expect(result.trend).toBe('stable');
  });
});

describe('detectAnomalies', () => {
  test('flags a category whose latest spend is a statistical outlier', () => {
    const anomalies = detectAnomalies([
      { category: 'Food', amounts: [2000, 2100, 1950, 2050, 6000] },
      { category: 'Transport', amounts: [1000, 1050, 980, 1020, 1010] },
    ]);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].category).toBe('Food');
    expect(anomalies[0].latest).toBe(6000);
  });

  test('returns no anomalies when all categories are within normal range', () => {
    const anomalies = detectAnomalies([
      { category: 'Food', amounts: [2000, 2100, 1950, 2050, 2020] },
    ]);
    expect(anomalies).toHaveLength(0);
  });

  test('skips categories with fewer than 3 data points (not enough history to judge)', () => {
    const anomalies = detectAnomalies([{ category: 'Rent', amounts: [10000, 50000] }]);
    expect(anomalies).toHaveLength(0);
  });
});
