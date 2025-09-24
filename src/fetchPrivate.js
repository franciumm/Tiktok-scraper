import puppeteer from 'puppeteer'
import fs        from 'fs/promises'
import path      from 'path'

/**
 * Logs into TikTok Studio via saved cookies,
 * navigates to your Videos analytics page,
 * and scrapes private metrics for each video.
 */
export async function fetchPrivateMetrics() {
  const browser = await puppeteer.launch({ headless: true })
  const page    = await browser.newPage()

  // 1) restore your TikTok Studio login cookies
  const cookiesPath = path.resolve('cookies.json')
  const cookiesJson = await fs.readFile(cookiesPath, 'utf8')
  const cookies     = JSON.parse(cookiesJson)
  await page.setCookie(...cookies)

  // 2) go to the Videos analytics list
  await page.goto(
    'https://www.tiktok.com/tiktokstudio/analytics/videos',
    { waitUntil: 'networkidle0' }
  )

  // 3) scrape every row for URL + private stats
  const rows = await page.$$eval(
    '.video-row-selector',   // <-- update to the real row selector
    videoRows => videoRows.map(r => {
      const videoUrl = r.querySelector('a.video-link')?.href || ''
      const retention      = r.querySelector('.retention .value')?.innerText.trim() || ''
      const avgWatch       = r.querySelector('.avg-watch .value')?.innerText.trim() || ''
      const newFollowers   = r.querySelector('.new-followers .value')?.innerText.trim() || ''
      const newVsReturning = r.querySelector('.new-vs-returning .value')?.innerText.trim() || ''

      // expand these selectors to match the actual DOM
      const genderEls      = Array.from(r.querySelectorAll('.gender .value')).map(e => e.innerText.trim())
      const ageEls         = Array.from(r.querySelectorAll('.age .value')).map(e => e.innerText.trim())
      const countryEls     = Array.from(r.querySelectorAll('.country .value')).map(e => e.innerText.trim())
      const trafficEls     = Array.from(r.querySelectorAll('.traffic-source .value')).map(e => e.innerText.trim())

      return {
        videoUrl,
        retention,
        avgWatch,
        newFollowers,
        newVsReturning,
        gender:      genderEls,
        age:         ageEls,
        country:     countryEls,
        trafficSources: trafficEls,
      }
    })
  )

  await browser.close()
  return rows
}
