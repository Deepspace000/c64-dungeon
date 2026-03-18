const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    console.log("Navigating to local server...");
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });

    console.log("Waiting 2 seconds...");
    await page.waitForTimeout(2000);

    console.log("Done.");
    await browser.close();
})();
