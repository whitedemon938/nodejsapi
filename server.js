const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 3000;

app.get('/scrape', async (req, res) => {
    let url = req.query.url; // Get URL from query parameter

    if (!url) {
        return res.status(400).json({ error: "Missing 'url' parameter" });
    }

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    let finalUrl = null;
    let newReferer = null;

    // First Page (Stealth Mode Test)
    const page1 = await browser.newPage();
    await page1.goto(url, { waitUntil: 'domcontentloaded' });
    await page1.close();

    // Second Page (With Referer Header)
    const page2 = await browser.newPage();
    await page2.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    page2.on('response', (response) => {
        if (response.status() >= 300 && response.status() < 400) { // Redirects (3xx status codes)
            finalUrl = response.headers()['location'];
            
            if (finalUrl && finalUrl.includes('safe')) {
                newReferer = finalUrl.split('safe')[0];
            }
        }
    });

    await page2.goto(url, { waitUntil: 'networkidle0' });
    await page2.close();

    let redirectMatch = null;

    // Third Page (If new referer found)
    if (newReferer) {
        const page3 = await browser.newPage();
        await page3.setExtraHTTPHeaders({
            'Referer': newReferer,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        await page3.goto(url, { waitUntil: 'networkidle0' });
        const pageContent = await page3.content();
        const match = pageContent.match(/window\.location\.href\s*=\s*["']([^"']+)["']/);

        if (match) {
            redirectMatch = match[1];
        }

        await page3.close();
    }

    await browser.close();

    // Return JSON response
    res.json({
        inputUrl: url,
        redirectedTo: finalUrl || "No redirect found",
        extractedUrl: redirectMatch || "No redirect URL found"
    });
});

app.listen(port, () => {
    console.log(`API running on ${port}`);
});
