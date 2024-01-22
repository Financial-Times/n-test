module.exports = async () => {
  const baseConfig = {
    forceExit: true,
  };
  return process.env.CI
    ? { ...baseConfig, testResultsProcessor: "jest-junit" }
    : baseConfig;
};
