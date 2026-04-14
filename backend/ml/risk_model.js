function calculateRiskScore(rain, aqi, temp) {
    // Basic weighted risk calculation
    return (0.4 * rain) + (0.3 * aqi) + (0.3 * temp);
}

module.exports = {
    calculateRiskScore
};
