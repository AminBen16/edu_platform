import fs from 'fs';
import path from 'path';
import { test, expect, Page } from '@playwright/test';

const config = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '..', 'config', 'local-test.config.json'),
    'utf8'
  )
);
const adminPages = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '..', 'coverage', 'admin-pages.json'),
    'utf8'
  )
) as string[];

type CrawlStats = {
  buttonsClicked: number;
  formsSubmitted: number;
  consoleErrors: string[];
  pageErrors: string[];
  requestFailures: string[];
  badResponses: string[];
  serverErrors: string[];
  brokenNavigations: string[];
};

class PlatformCrawler {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async login() {
    await this.page.goto('/auth/login');
    await this.page.fill('input[type="email"]', config.credentials.admin.email);
    await this.page.fill(
      'input[type="password"]',
      config.credentials.admin.password
    );
    await this.page.click('button[type="submit"]');
    await this.page.waitForLoadState('networkidle');
    await expect(this.page).not.toHaveURL(/\/auth\/login$/);
  }

  async fillVisibleForm(stats: CrawlStats) {
    const fields = this.page.locator(
      'input:not([type="hidden"]):not([type="submit"]), textarea, select'
    );
    const count = await fields.count();
    for (let index = 0; index < count; index += 1) {
      const field = fields.nth(index);
      if (!(await field.isVisible()) || !(await field.isEnabled())) {
        continue;
      }

      const tagName = await field.evaluate((node) => node.tagName.toLowerCase());
      const inputType = await field.getAttribute('type');
      const fieldName =
        (await field.getAttribute('name')) ||
        (await field.getAttribute('aria-label')) ||
        `field-${index}`;

      if (tagName === 'select') {
        const optionCount = await field.locator('option').count();
        if (optionCount > 1) {
          await field.selectOption({ index: 1 });
        }
        continue;
      }

      if (inputType === 'checkbox' || inputType === 'radio') {
        await field.check().catch(() => {});
        continue;
      }

      if (inputType === 'email') {
        await field.fill(`qa-${Date.now()}@example.com`);
        continue;
      }

      if (inputType === 'number') {
        await field.fill('1');
        continue;
      }

      if (fieldName.toLowerCase().includes('password')) {
        await field.fill('Admin@123');
        continue;
      }

      await field.fill(`Automated ${fieldName}`);
    }

    const submitButton = this.page
      .locator(
        'button[type="submit"], button:has-text("Save"), button:has-text("Create"), button:has-text("Send"), button:has-text("Invite")'
      )
      .first();

    if (await submitButton.isVisible().catch(() => false)) {
      await submitButton.click().catch(() => {});
      stats.formsSubmitted += 1;
      await this.page.waitForTimeout(800);
    }
  }

  async clickSafeActions(stats: CrawlStats) {
    const controls = this.page.locator(
      'button, [role="button"], a[href], input[type="submit"]'
    );
    const count = await controls.count();
    const seenLabels = new Set<string>();

    for (let index = 0; index < count; index += 1) {
      const control = controls.nth(index);
      if (!(await control.isVisible().catch(() => false))) {
        continue;
      }
      if (!(await control.isEnabled().catch(() => false))) {
        continue;
      }

      const label =
        (await control.innerText().catch(() => '')) ||
        (await control.getAttribute('aria-label')) ||
        (await control.getAttribute('href')) ||
        `control-${index}`;

      const normalizedLabel = label.trim().toLowerCase();
      if (
        !normalizedLabel ||
        normalizedLabel.includes('delete') ||
        normalizedLabel.includes('remove') ||
        normalizedLabel.includes('logout') ||
        normalizedLabel.includes('sign out') ||
        seenLabels.has(normalizedLabel)
      ) {
        continue;
      }

      seenLabels.add(normalizedLabel);
      await control.click({ force: true }).catch(() => {});
      stats.buttonsClicked += 1;
      await this.page.waitForTimeout(500);

      const dialog = this.page.locator('[role="dialog"], .modal');
      if (await dialog.first().isVisible().catch(() => false)) {
        await this.fillVisibleForm(stats);
        const closeButton = this.page
          .locator(
            'button:has-text("Cancel"), button:has-text("Close"), button[aria-label="Close"]'
          )
          .first();
        if (await closeButton.isVisible().catch(() => false)) {
          await closeButton.click().catch(() => {});
        }
      }
    }
  }
}

test.describe('Local Admin Platform Crawler', () => {
  let stats: CrawlStats;

  test.beforeEach(async ({ page }) => {
    stats = {
      buttonsClicked: 0,
      formsSubmitted: 0,
      consoleErrors: [],
      pageErrors: [],
      requestFailures: [],
      badResponses: [],
      serverErrors: [],
      brokenNavigations: [],
    };

    page.on('console', (message) => {
      if (message.type() === 'error') {
        stats.consoleErrors.push(message.text());
      }
    });

    page.on('pageerror', (error) => {
      stats.pageErrors.push(error.message);
    });

    page.on('requestfailed', (request) => {
      stats.requestFailures.push(
        `${request.method()} ${request.url()} :: ${request.failure()?.errorText}`
      );
    });

    page.on('response', (response) => {
      const url = response.url();
      if (
        url.startsWith(config.adminBaseUrl) &&
        response.status() >= 400 &&
        !url.includes('/_next/')
      ) {
        const failure = `${response.status()} ${url}`;
        stats.badResponses.push(failure);

        if (response.status() >= 500) {
          stats.serverErrors.push(failure);
        }

        if (
          response.request().method() === 'GET' &&
          !url.includes('/api/')
        ) {
          stats.brokenNavigations.push(failure);
        }
      }
    });

    const crawler = new PlatformCrawler(page);
    await crawler.login();
  });

  test('clicks through discovered admin pages and safe actions', async ({ page }) => {
    const crawler = new PlatformCrawler(page);
    const pagesToVisit = adminPages.filter(
      (route) => route !== '/auth/login' && route !== '/auth/register'
    );

    for (const route of pagesToVisit) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page).not.toHaveURL(/\/auth\/login$/);
      await crawler.clickSafeActions(stats);
    }

    fs.mkdirSync(path.resolve(__dirname, '..', 'results'), { recursive: true });
    fs.writeFileSync(
      path.resolve(__dirname, '..', 'results', 'admin-crawl-summary.json'),
      `${JSON.stringify(stats, null, 2)}\n`
    );

    expect(stats.consoleErrors, 'Console errors should be empty').toEqual([]);
    expect(stats.pageErrors, 'Page crashes should be empty').toEqual([]);
    expect(stats.requestFailures, 'Network failures should be empty').toEqual([]);
    expect(stats.serverErrors, 'Server errors should be empty').toEqual([]);
    expect(
      stats.brokenNavigations,
      'Broken page navigations should be empty'
    ).toEqual([]);
  });
});
