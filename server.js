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
            executablePath: "/usr/bin/chromium-browser", // Use system-installed Chromium
        });

        const page = await browser.newPage();

        await page.setExtraHTTPHeaders({
            Referer: "https://indiaraja.com/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        });

        let finalUrl = null;
        let newReferer = null;

        // Capture redirects (3xx responses)
        page.on("response", (response) => {
            if (response.status() >= 300 && response.status() < 400) {
                finalUrl = response.headers()["location"];
                if (finalUrl && finalUrl.includes("safe")) {
                    newReferer = finalUrl.split("safe")[0];
                    console.log(`Redirected to: ${finalUrl}`);
                    console.log(`New Referer: ${newReferer}`);
                }
            }
        });

        await page.goto(url, { waitUntil: "networkidle0", timeout: 0 });
        await page.close();

        let extractedRedirect = null;

        if (newReferer) {
            const page2 = await browser.newPage();
            await page2.setExtraHTTPHeaders({
                Referer: newReferer,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            });

            await page2.goto(url, { waitUntil: "networkidle0", timeout: 0 });

            const pageContent = await page2.content();
            const redirectMatch = pageContent.match(/window\.location\.href\s*=\s*["']([^"']+)["']/);

            if (redirectMatch) {
                extractedRedirect = redirectMatch[1];
                console.log(`Extracted Redirect URL: ${extractedRedirect}`);
            } else {
                console.log("No redirect URL found.");
            }

            await page2.close();
        }

        await browser.close();

        return res.json({ finalRedirect: finalUrl, extractedRedirect });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});
