
// src/Operate/controller.js
import fs      from 'node:fs/promises';
import path    from 'node:path';
import axios   from 'axios';
import ExcelJS from 'exceljs';

// ——————————————————————————————————————————————
// 1️⃣ Build your common query params here
// ——————————————————————————————————————————————
const BASE_URL = 'https://www.tiktok.com/aweme/v2/data/insight/';
const COMMON_PARAMS = {
  locale:           'de-DE',
  aid:              '1988',
  priority_region:  'EG',
  region:           'EG',
  tz_name:          'Africa/Cairo',
  app_name:         'tiktok_creator_center',
  app_language:     'de-DE',
  device_platform:  'web_pc',
  channel:          'tiktok_web',
  device_id:        '7427015935049844229',       // ← keep this in sync with your browser/devtools
  os:               'win',
  screen_width:     1050,
  screen_height:    1680,
  browser_language: 'de',
  browser_platform: 'Win32',
  browser_name:     'Mozilla',
  browser_version:  '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
  tz_offset:        10800,
};

// ——————————————————————————————————————————————
// 2️⃣ The five insight-types you care about
// ——————————————————————————————————————————————
const TYPE_REQUESTS = [
  { insigh_type: 'incentive_vv',       prevCycleStartDays: 16, days: 16, end_days: 1 },
  { insigh_type: 'vv_traffic_source',  days: 7, end_days: 1 },
  { insigh_type: 'user_search_terms',  range: 1 },
  { insigh_type: 'unique_viewer_num',  range: 1 },
  { insigh_type: 'follower_num' },
];

// ——————————————————————————————————————————————
// 3️⃣ helper to load your login cookies.json
// ——————————————————————————————————————————————
async function getCookieHeader() {
  const text = await fs.readFile(path.resolve('./cookies.json'), 'utf8');
  const cookies = JSON.parse(text);
  return cookies.map(c => ${c.name}=${c.value}).join('; ');
}

// ——————————————————————————————————————————————
// 4️⃣ Fetch them all at once
// ——————————————————————————————————————————————
async function fetchAllMetrics() {
  const resp = await axios.get(BASE_URL, {
    params: {
      ...COMMON_PARAMS,
      type_requests: JSON.stringify(TYPE_REQUESTS),
    },
    headers: {
      Cookie:        await getCookieHeader(),
      'User-Agent':  COMMON_PARAMS.browser_version,
      Accept:        'application/json, text/plain, */*',
    },
  });

  if (resp.status !== 200 || resp.data.status_code !== 0) {
    throw new Error(TikTok Insights failed: ${resp.status} / ${resp.data.status_msg});
  }
  return resp.data;
}

// ——————————————————————————————————————————————
// 5️⃣ Write out Excel tabs for exactly the fields you showed me
// ——————————————————————————————————————————————
async function writeToExcel(data, filePath) {
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.readFile(filePath); } catch { /* brand-new file */ }

  const today = new Date().toISOString().slice(0,10);

  // — Overview sheet: follower & viewer counts + incentive status
  let ov = wb.getWorksheet('Overview');
  if (!ov) ov = wb.addWorksheet('Overview');
  if (ov.rowCount === 0) {
    ov.addRow(['Date','Followers','Unique Viewers','Incentive VV Status']);
  }
  ov.addRow([
    today,
    data.follower_num?.value ?? null,
    data.unique_viewer_num?.value ?? null,
    data.incentive_vv?.status   ?? null,
  ]);

  // — Traffic Sources sheet (page percent)
  let tr = wb.getWorksheet('Traffic Sources');
  if (!tr) tr = wb.addWorksheet('Traffic Sources');
  if (tr.rowCount === 0) {
    tr.addRow(['Page','Pct (string)','Pct (raw)']);
  }
  (data.video_page_percent?.value || []).forEach(item => {
    tr.addRow([ item.key, item.str_value, item.value ]);
  });

  // — Search Terms sheet (if any)
  let st = wb.getWorksheet('Search Terms');
  if (!st) st = wb.addWorksheet('Search Terms');
  if (st.rowCount === 0) {
    st.addRow(['Term','Count']);
  }
  const terms = data.user_search_terms?.value;
  if (Array.isArray(terms)) {
    terms.forEach(t => st.addRow([ t.key, t.value ]));
  }

  await wb.xlsx.writeFile(filePath);
}

// ——————————————————————————————————————————————
// 6️⃣ Your Express controller
// ——————————————————————————————————————————————
export const getAnalytics = async (req, res) => {
  try {
    const all = await fetchAllMetrics();
    await writeToExcel(all, path.resolve('./analytics.xlsx'));
    return res.json({
      success: true,
      message: 'Metrics saved to analytics.xlsx',
      data: all
    });
  } catch (err) {
    console.error('getAnalytics error:', err);
    return res.status(500).json({ error: err.message });
  }
};