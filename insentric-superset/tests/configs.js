/* eslint-disable no-undef */
export const instanceId = __ENV.INSTANCE_ID || 'development';

export const supersetPath = `https://${instanceId}.report.insentric.net`;
export const insentricAdminPath = `https://${instanceId}.admin.insentric.net`;

export const testName = __ENV.TEST_NAME || 'loadtest';

export const resultsPath = __ENV.RESULTS_PATH || 'results';

export const testUser = __ENV.TEST_USER;
export const testUserPassword = __ENV.TEST_USER_PASSWORD;

export const grafanaProjectId = __ENV.GRAFANA_PROJECT_ID || 3675759;

if (!testUser) {
  throw new Error('TEST_USER is required');
}

if (!testUserPassword) {
  throw new Error('TEST_USER_PASSWORD is required');
}
