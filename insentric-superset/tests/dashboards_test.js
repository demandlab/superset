import { browser } from 'k6/browser';
import { parseHTML } from 'k6/html';
import { check, sleep, group } from 'k6';
import { Counter, Rate } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { insentricAdminPath, testUser, testName, testUserPassword, resultsPath, grafanaProjectId, supersetPath } from './configs.js';
import { navigateTabs }from './util.js';

// Custom metrics for better reporting
export const dashboardErrorCount = new Counter('dashboard_errors_total');
export const dashboardErrorRate = new Rate('dashboard_error_rate');
export const sqlErrorCount = new Counter('sql_errors_total');
export const httpErrorCount = new Counter('http_errors_total');

export const options = {
  cloud: {
    projectID: grafanaProjectId,
  },
  scenarios: {
    browser: {
      options: {
        browser: {
          type: 'chromium'
        },
      },
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
    dashboard_error_rate: ['rate==0'],
    sql_errors_total: ['count==0'],
    http_errors_total: ['count==0']
  },
};

const EXCLUDED_DASHBOARD_PATHS = [];

export default async function () {
  const dashboardResults = [];

  const loginPage = await browser.newPage();

  // Login process
  await loginPage.goto(`${insentricAdminPath}/auth`);
  await loginPage.waitForLoadState('networkidle');
  await loginPage.locator('input#email').fill(testUser);
  await loginPage.locator('input#password').fill(testUserPassword);
  await loginPage.locator('button.btn[type="submit"]').click();
  await loginPage.waitForSelector('a[href="/dashboard/list/"]');

  const context = loginPage.context();

  // Navigate to dashboard list to get links
  await loginPage.goto(`${supersetPath}/dashboard/list`);
  await loginPage.waitForSelector('div.antd5-card-cover a', { state: 'visible' });
  sleep(2);

  const document = parseHTML(await loginPage.content());
  const dashboardLinks = document.find('div.antd5-card-cover a').toArray()
    .map((el) => el.get(0).href_element.getAttribute('href'))
    .filter((path) => !EXCLUDED_DASHBOARD_PATHS.includes(path.split('/')[3]));

  await loginPage.close();

  // Test each dashboard
  for (const path of dashboardLinks) {
    await testDashboard(context, path, dashboardResults)
  }

  // Final summary check
  group('Summary', function() {
    const totalErrors = dashboardResults.reduce((sum, r) => sum + r.errors.length, 0);
    const successfulDashboards = dashboardResults.filter(r => r.success).length;
    
    console.log(`\n========================================`);
    console.log(`          FINAL SUMMARY`);
    console.log(`========================================`);
    console.log(`Total Dashboards Tested: ${dashboardResults.length}`);
    console.log(`Successful: ${successfulDashboards}`);
    console.log(`Failed: ${dashboardResults.length - successfulDashboards}`);
    console.log(`Total Errors: ${totalErrors}`);
    
    if (dashboardResults.length - successfulDashboards > 0) {
      console.log(`❌ Failed Dashboards:`);
      dashboardResults.filter(r => !r.success).forEach(dashboard => {
        console.log(`   - ${dashboard.dashboard} (${dashboard.errors.length} errors)`);
      });
    }
    
    console.log(`✅ Successful Dashboards:`);
    dashboardResults.filter(r => r.success).forEach(dashboard => {
      console.log(`   - ${dashboard.dashboard}`);
    });
    
    check(dashboardResults, {
      'all dashboards passed': (results) => results.every(r => r.success),
      [`${successfulDashboards}/${dashboardResults.length} dashboards successful`]: () => true
    });
  });
}

async function testDashboard(context, path, dashboardResults) {
  const dashboardName = path.split('/').pop() || path;
    const dashboardErrors = [];
    const checkPromises = [];

    // Create page outside of group since it's async
    const dashboardPage = await context.newPage();

    dashboardPage.on('response', (res) => {
      if (res.ok()) return;

      const url = res.url();
      if (url.match('/chart/data')) {

        checkPromises.push((async () => {
          const status = res.status();
          const dashboardId = url.split('dashboard_id=')[1].split('&')[0];
          let details = null;

          try {
            details = (await res.json())?.errors;
          } catch (e) {
            details = 'Could not parse error response';
          }

          const errorInfo = {
            url,
            status,
            dashboardId,
            details,
            dashboard: dashboardName
          };

          dashboardErrors.push(errorInfo);

          // Update custom metrics with tags
          dashboardErrorCount.add(1, { 
            dashboard: dashboardName,
            status: status.toString(),
            dashboard_id: dashboardId 
          });

          // Track specific error types
          if (details && Array.isArray(details)) {
            const hasSqlError = details.some(d => d.error_type === 'INVALID_SQL_ERROR');
            if (hasSqlError) {
              sqlErrorCount.add(1, { 
                dashboard: dashboardName,
                dashboard_id: dashboardId 
              });
            }
          }

          httpErrorCount.add(1, { 
            dashboard: dashboardName,
            status: status.toString() 
          });

        })());
      }
    });

    await dashboardPage.goto(`${supersetPath}${path}`);
    await dashboardPage.waitForLoadState('networkidle');

    try {
      await dashboardPage.waitForSelector('.dashboard-chart', { state: 'visible' });
    } catch {
      dashboardErrors.push({
            details : 'No visible charts loaded',
            dashboard: dashboardName
          })
    }
    
    const tabsVisited = await navigateTabs(dashboardPage);

    await dashboardPage.waitForLoadState('networkidle');

    await Promise.all(checkPromises);

    console.log(`=== Dashboard: ${dashboardName} ===`);

    console.log(`Tabs visited: ${tabsVisited}`)
    
    if (dashboardErrors.length > 0) {
      console.log(`❌ Dashboard loaded with ${dashboardErrors.length} errors`)
      dashboardErrors.forEach((error, index) => {
        console.log(`Error ${index + 1}:`);
        console.log(`  Status: ${error.status}`);
        console.log(`  Dashboard ID: ${error.dashboardId}`);
        console.log(`  URL: ${error.url}`);
        
        if (error.details && Array.isArray(error.details)) {
          error.details.forEach((detail, detailIndex) => {
            console.log(`  Detail ${detailIndex + 1}:`);
            console.log(`    Type: ${detail.error_type || 'Unknown'}`);
            console.log(`    Message: ${detail.message || 'No message'}`);
            if (detail.extra && detail.extra.sql) {
              console.log(`    SQL: ${detail.extra.sql.substring(0, 200)}...`);
            }
          });
        } else if (typeof error.details === 'string') {
          console.log(`  Details: ${error.details}`);
        }
      });
    } else {
      console.log(`✅ Dashboard loaded without errors!`);
    }

    // Group the checks and metrics for this dashboard
    group(`Dashboard: ${dashboardName}`, function() {
      // Record error rate for this dashboard
      dashboardErrorRate.add(dashboardErrors.length > 0, { dashboard: dashboardName });

      // Enhanced checks with tags
      check(dashboardErrors, {
        'loads without chart data errors': (errs) => errs.length === 0,
        'has no SQL errors': (errs) => !errs.some(e => 
          e.details && Array.isArray(e.details) && 
          e.details.some(d => d.error_type === 'INVALID_SQL_ERROR')
        ),
        'has no 5xx server errors': (errs) => !errs.some(e => e.status >= 500),
        'has no 4xx client errors': (errs) => !errs.some(e => e.status >= 400 && e.status < 500)
      }, { dashboard: dashboardName });
    });

    dashboardResults.push({
      dashboard: dashboardName,
      path: path,
      success: dashboardErrors.length === 0,
      errors: [...dashboardErrors]
    });

    await dashboardPage.close();
}