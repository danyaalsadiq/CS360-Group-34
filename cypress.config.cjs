const { defineConfig } = require('cypress')
experimentalRunAllSpecs=true;
module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://cs-360-group-34-final-deployment.vercel.app/',
    setupNodeEvents(on, config) {
      
      return config;
    },
  },
  // Added to ensure proper error logging and timeouts
  defaultCommandTimeout: 15000,
  requestTimeout: 15000,
  responseTimeout: 15000,
  pageLoadTimeout: 30000,
  viewportWidth: 1280,
  viewportHeight: 800
})