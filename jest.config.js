module.exports = async () => {
  return process.env.CI ? { testResultsProcessor: "jest-junit" } : {};
};
