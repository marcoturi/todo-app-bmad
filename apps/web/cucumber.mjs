const getWorldParameters = () => {
  return {
    SERVER_URL: process.env.SERVER_URL,
  };
};

const config = {
  requireModule: ['ts-node/register'],
  require: [
    'e2e/steps/**/*.ts',
    'e2e/support/**/*.ts',
    'e2e/page-objects/**/*.ts',
  ],
  paths: ['e2e/**/*.feature'],
  format: [
    'json:reports/cucumber-report.json',
    'html:reports/index.html',
    'summary',
    'progress-bar',
    '@cucumber/pretty-formatter',
  ],
  formatOptions: { snippetInterface: 'async-await' },
  worldParameters: getWorldParameters(),
};

export default config;
