const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/scrape", async (req, res) => {
    let url = req.query.url;

    if (!url) {
        return res.status(400).json({ error: "URL is required!" });
    }

    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser", // ✅ Use Chromium
        });

        const page = await browser.newPage();

        await page.setExtraHTTPHeaders({
            Referer: "https://indiaraja.com/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        });

        await page.goto(url, { waitUntil: "networkidle0", timeout: 0 });
        const pageContent = await page.content();

        const redirectMatch = pageContent.match(/window\.location\.href\s*=\s*["']([^"']+)["']/);
        const extractedRedirect = redirectMatch ? redirectMatch[1] : null;

        await browser.close();

        return res.json({ extractedRedirect });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});
