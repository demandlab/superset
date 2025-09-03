import { browser } from 'k6/browser';
import { parseHTML } from 'k6/html';
import { Trend } from 'k6/metrics';
import { check, sleep } from 'k6';

import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

import { testUser, testName, testUserPassword, resultsPath, grafanaProjectId, supersetPath } from './configs.js';

export const options = {
  cloud: {
    projectID: grafanaProjectId,
  },
  discardResponseBodies: true,
  scenarios: {
    browser: {
      options: {
        browser: {
          type: 'chromium'
        },
      },
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '300s', target: 10 },
        { duration: '300s', target: 40 },
        { duration: '300s', target: 0 }
      ]
      // executor: 'constant-arrival-rate',
      // duration: '900s',
      // rate: 1,
      // timeUnit: '5s',
      // preAllocatedVUs: 2,
      // maxVUs: 50,
      // gracefulStop: '180s'

    },
  },
  thresholds: {
    checks: ['rate==1.0']
  },
};

const EXCLUDED_DASHBOARD_PATHS = [
  'explore-customer-journey-stage-details' // this dashboard is not loading
];

const dashboardLoadTimeTrend = new Trend('dashboard_load_time', true);


export default async function () {

  const page = await browser.newPage();

  let testResult;

  try {

  const loginPage = await browser.newPage();

  // Login process
  await loginPage.goto(`${insentricAdminPath}/auth`);
  await loginPage.waitForLoadState('networkidle');
  await loginPage.locator('input#email').fill(testUser);
  await loginPage.locator('input#password').fill(testUserPassword);
  await loginPage.locator('button.btn[type="submit"]').click();
  await loginPage.waitForSelector('a[href="/dashboard/list/"]');

    await page.goto(`${supersetPath}/dashboard/list`);

    await page.waitForSelector('div.ant-card-cover a', { state: 'visible' });

    sleep(2)

    const document = parseHTML(await page.content());

    const dashboardLinks = document.find('div.ant-card-cover a').toArray()
      .map((el) => el.get(0).href_element.getAttribute('href'))
      .filter((path) => !EXCLUDED_DASHBOARD_PATHS.includes(path.split('/')[3]));

    for (let i = 0; i < 2; i++) {
      for (const path of dashboardLinks) {

        const dashboardSlug = path.split('/')[3].replace(/-/g, '_');

        // const path = dashboardLinks[Math.floor(Math.random() * dashboardLinks.length)];

        await page.goto(`${supersetPath}${path}`);

        await page.waitForSelector('.dashboard-chart', { state: 'visible' });

        await page.evaluate(() => window.performance.mark('dashboard-opened'));

        await page.waitForFunction(() => {

          if (document.querySelector('.loading') === null) {
            window.performance.mark('dashboard-loaded');
            return true;
          };

          return false;

        });

        // Get time difference between visiting opening the dashboard and the dashboard loading
        await page.evaluate(() =>
          window.performance.measure('dashboard-load-time', 'dashboard-opened', 'dashboard-loaded')
        );

        const dashboardLoadTime = await page.evaluate(
          () =>
            JSON.parse(JSON.stringify(window.performance.getEntriesByName('dashboard-load-time')))[0]
              .duration
        );

        dashboardLoadTimeTrend.add(dashboardLoadTime, { dashboard: dashboardSlug, round: i });

        sleep(10);

      }
    }

    testResult = 'success';

  }
  finally {
    await page.close();
    check(testResult, { 'Test completed sucessfully': (r) => r === 'success' });
  }

}

export function handleSummary(data) {
  return {
    [`./${resultsPath}/${testName}.html`]: htmlReport(data),
  };
}

