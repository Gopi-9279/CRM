// jest configuration to limit workers and increase memory allocation
module.exports = {
  testEnvironment: 'node',
  maxWorkers: 2,
  // you can also set a timeout if needed
  testTimeout: 30000,
};
