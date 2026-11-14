import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

// Disposable browser contexts. Use the same local production server for both runs.
const phase = process.argv[2];
if (!["before", "after"].includes(phase)) throw new Error("Use before or after");
const out = "docs/research/performance";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || "msedge" });
const rows = [];
try {
  for (const width of [1440, 375, ...(phase === "after" ? [768] : [])]) {
    for (const route of ["/explore", "/compare", "/universities/mit", "/funding", "/calculator", "/dashboard", "/planner"]) {
      const context = await browser.newContext({ viewport: { width, height: width === 375 ? 812 : 900 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", {cacheDisabled:true});
      if (width === 375) {
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        await cdp.send("Network.emulateNetworkConditions", {offline:false, latency:60, downloadThroughput:1_250_000, uploadThroughput:375_000});
      }
      await page.addInitScript(() => {
        window.sample = {lcpMs:null, cls:0, longTaskMs:0, blockingMs:0, readyMs:null};
        for (const type of ["largest-contentful-paint","layout-shift","longtask"]) {
          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              if(type === "largest-contentful-paint") window.sample.lcpMs = entry.startTime;
              if(type === "layout-shift" && !entry.hadRecentInput) window.sample.cls += entry.value;
              if(type === "longtask") {
                window.sample.longTaskMs += entry.duration;
                window.sample.blockingMs += Math.max(0, entry.duration - 50);
              }
            }
          }).observe({type, buffered:true});
        }
        const observer = new MutationObserver(() => {
          if (document.querySelector('button[aria-label*="theme"]:not(:disabled)')) {
            window.sample.readyMs = performance.now();
            observer.disconnect();
          }
        });
        observer.observe(document,{subtree:true,childList:true,attributes:true});
      });
      await page.goto("http://127.0.0.1:3000"+route);
      await page.waitForFunction(() => window.sample.readyMs !== null);
      await page.waitForTimeout(1200);
      const metrics = await page.evaluate(() => ({
        ...window.sample, navigationMs:performance.getEntriesByType("navigation")[0].loadEventEnd,
        jsEncodedBytes:performance.getEntriesByType("resource").filter(r => /\.js(?:\?|$)/.test(r.name)).reduce((n,r)=>n+r.encodedBodySize,0),
        overflows:document.documentElement.scrollWidth > innerWidth
      }));
      if(route === "/explore") {
        const search = page.getByRole("textbox",{name:"Search universities"});
        await search.focus();
        await page.evaluate(() => {
          document.addEventListener("input", () => {
            const start = performance.now();
            requestAnimationFrame(() => requestAnimationFrame(() => {window.filterMs = performance.now()-start;}));
          },{once:true});
        });
        await search.press("m");
        await page.waitForFunction(() => window.filterMs != null);
        metrics.filterTwoFramesMs = await page.evaluate(() => window.filterMs);
        await search.fill("");
      }
      if(phase === "after" && ["/explore","/calculator","/universities/mit"].includes(route)) {
        await page.screenshot({path:out+"/"+width+"-"+route.split("/").pop()+".png"});
      }
      rows.push({width,route,...metrics});
      await writeFile(out+"/"+phase+".json",JSON.stringify(rows,null,2)+"\n");
      await context.close();
    }
  }
} finally {await browser.close();}
