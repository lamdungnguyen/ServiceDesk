function clampScore(value) {
  return Math.max(0, Math.min(100, Number(value)));
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, item) => sum + item, 0) / values.length;
}

module.exports = {
  clampScore,
  average
};
