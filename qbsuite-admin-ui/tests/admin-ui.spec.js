import { test, expect } from '@playwright/test';
const titles = ['Attendance Overview', 'Leads Overview', 'Monthly Revenue', 'Employee Performance', 'Production Overview', 'Customer Growth', 'Sales Analytics', 'Payroll Analytics'];
for (const [name, width, height] of [['mobile',390,844],['tablet',768,1024],['laptop',1366,768],['desktop',1920,1080]]) {
  test(`suite dashboard responds at ${name} size`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height });
    await page.goto('/admin/dashboard');
    for (const title of titles) await expect(page.locator('[data-chart-card]').filter({ has: page.getByText(title, { exact: true }) })).toHaveCount(1);
    await expect(page.locator('[data-slot="chart"]')).toHaveCount(8);
    await expect(page.locator('[data-slot="chart"] svg').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(await page.locator('main').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    if (width < 1024) {
      await page.getByRole('button', { name: 'Open Navigation' }).click();
      await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeVisible();
      await page.keyboard.press('Escape');
    }
    await page.screenshot({ path: `test-results/dashboard-${name}.png`, fullPage: false });
    expect(errors).toEqual([]);
  });
}
test('shared table sorts, searches, paginates, selects and hides columns', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/admin/hrm/employees');
  const table = page.getByRole('table', { name: 'Employees: searchable, sortable and paginated' });
  await expect(table.locator('tbody tr')).toHaveCount(8);
  await page.getByRole('button', { name: 'Sort by Employee', exact: true }).click();
  await expect(table.getByRole('columnheader', { name: /Employee/ })).toHaveAttribute('aria-sort', 'ascending');
  await expect(table.locator('tbody tr').first()).toContainText('Alexander');
  await table.getByRole('checkbox').nth(1).click();
  await expect(page.getByText('1 selected', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('Page 2 of 2', { exact: true })).toBeVisible();
  await expect(table.locator('tbody tr')).toHaveCount(2);
  await page.getByRole('textbox', { name: 'Search Employees', exact: true }).fill('Priya');
  await expect(table.locator('tbody tr')).toHaveCount(1);
  await expect(table).toContainText('Priya');
  await page.getByRole('button', { name: 'Columns', exact: true }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Department & Role', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(table.getByRole('columnheader', { name: 'Sort by Department & Role', exact: true })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Search Employees', exact: true }).fill('No such record');
  await expect(table).toContainText('No employees');
});
test('chart date filters update the chart and its accessible data', async ({ page }) => {
  await page.goto('/admin/dashboard');
  const card = page.locator('[data-chart-card="Monthly Revenue"]');
  await expect(card.getByText(/6 observations/)).toBeVisible();
  await card.getByLabel('Monthly Revenue from date', { exact: true }).fill('2027-01-01');
  await expect(card.getByText('No chart data', { exact: true })).toBeVisible();
  await card.getByRole('combobox', { name: 'Monthly Revenue period' }).click();
  await page.getByRole('option', { name: 'Last 90 days', exact: true }).click();
  await expect(card.getByText(/3 observations/)).toBeVisible();
  await card.getByText('View accessible chart data', { exact: true }).click();
  await expect(card.getByRole('table')).toContainText('₹');
});
test('module dashboards reuse charts and preserve unconnected empty states', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const moduleName of ['production','customer']) {
    await page.goto(`/admin/${moduleName}/dashboard`);
    await expect(page.getByText('Not connected', { exact: true })).toBeVisible();
    await expect(page.getByRole('table').first()).toContainText('A data source has not been connected.');
    await page.getByRole('button', { name: 'Workspace information' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box.width).toBeLessThanOrEqual(390);
    expect(box.height).toBeLessThanOrEqual(844);
    await page.keyboard.press('Escape');
    expect(await page.locator('main').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  }
});
