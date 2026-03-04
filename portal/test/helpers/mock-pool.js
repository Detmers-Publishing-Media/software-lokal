// Wiederverwendbarer pool.query Mock fuer Tests
function createMockPool() {
  const calls = [];
  const resultQueue = [];
  const pool = {
    query: async (sql, params) => {
      const call = { sql: sql.replace(/\s+/g, ' ').trim(), params };
      calls.push(call);
      if (resultQueue.length > 0) {
        return resultQueue.shift();
      }
      if (pool._nextResult) {
        const result = pool._nextResult;
        pool._nextResult = null;
        return result;
      }
      return { rows: [], rowCount: 0 };
    },
    _nextResult: null,
    _calls: calls,
    mockResult(result) {
      pool._nextResult = result;
    },
    mockResults(results) {
      resultQueue.length = 0;
      resultQueue.push(...results);
    },
    reset() {
      calls.length = 0;
      pool._nextResult = null;
      resultQueue.length = 0;
    },
  };
  return pool;
}

module.exports = { createMockPool };
