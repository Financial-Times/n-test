module.exports = async () => {
  return process.env.CI ? { reporters: ["default", "jest-junit"] } : {};
};
