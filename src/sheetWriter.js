// src/sheetWriter.js

import { GoogleAuth } from 'google-auth-library'
import { google }     from 'googleapis'
import ExcelJS        from 'exceljs'
import fs             from 'fs/promises'

/**
 * Append rows to a local Excel file (analytics.xlsx).
 * If the file is open/locked, we warn instead of crashing.
 */
export async function appendToExcel(rows, filePath = './analytics.xlsx') {
  const wb = new ExcelJS.Workbook()
  let worksheet

  // 1) try to read existing file
  try {
    await wb.xlsx.readFile(filePath)
    worksheet = wb.getWorksheet('Data') || wb.addWorksheet('Data')
  } catch (readErr) {
    if (readErr.code === 'EBUSY' || readErr.code === 'EACCES') {
      console.warn(`⚠️  Excel locked—please close ${filePath} (read) and rerun.`)
      return
    }
    // file doesn’t exist at all? create it.
    worksheet = wb.addWorksheet('Data')
  }

  // 2) ensure header row
  if (worksheet.rowCount === 0) {
    worksheet.addRow([
      'Date','Video URL','Title','Views','Likes','Comments','Shares','Favorites',
      'Retention%','AvgWatch','NewFollowers','NewVsReturning%','Gender%','AgeBreakdown',
      'CountryBreakdown','TrafficSources'
    ])
  }

  // 3) append your new rows
  const today = new Date().toISOString().slice(0,10)
  for (let r of rows) {
    worksheet.addRow([
      today,
      r.videoUrl,
      r.title, r.views, r.likes, r.comments, r.shares, r.favorites,
      r.retention, r.avgWatch, r.newFollowers, r.newVsReturning,
      JSON.stringify(r.gender),
      JSON.stringify(r.age),
      JSON.stringify(r.country),
      JSON.stringify(r.trafficSources),
    ])
  }

  // 4) write back, with catch for locked file
  try {
    await wb.xlsx.writeFile(filePath)
    console.log(`✅ Excel updated: ${filePath}`)
  } catch (writeErr) {
    if (writeErr.code === 'EBUSY' || writeErr.code === 'EACCES') {
      console.warn(`⚠️  Excel locked—please close ${filePath} (write) and rerun.`)
      return
    }
    throw writeErr
  }
}

/**
 * Append rows to a Google Sheet “Data” sheet.
 * Requires:
 *   • GOOGLE_KEYFILE_PATH  → path to your service-account JSON
 *   • GOOGLE_SHEETS_ID      → your sheet’s ID
 */
export async function appendToGoogleSheet(rows) {
  if (!rows || rows.length === 0) {
    console.log('⚠️ Sheets: nothing to append, skipping')
    return
  }

  const auth = new GoogleAuth({
    keyFile: process.env.GOOGLE_KEYFILE_PATH,
    scopes:  ['https://www.googleapis.com/auth/spreadsheets']
  })
  const client = await auth.getClient()
  const sheets = google.sheets({ version:'v4', auth: client })

  const values = rows.map(r => [
    new Date().toISOString().slice(0,10),
    r.videoUrl, r.title, r.views, r.likes, r.comments,
    r.shares, r.favorites, r.retention, r.avgWatch,
    r.newFollowers, r.newVsReturning,
    JSON.stringify(r.gender),
    JSON.stringify(r.age),
    JSON.stringify(r.country),
    JSON.stringify(r.trafficSources),
  ])

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId:   process.env.GOOGLE_SHEETS_ID,
      range:           'Data!A1',
      valueInputOption:'RAW',
      requestBody:     { values }
    })
    console.log('✅ Google Sheet updated')
  } catch (err) {
    if (err.code === 404) {
      console.error(
        '❌ Google Sheets not found – ' +
        'check that GOOGLE_SHEETS_ID is correct and that you’ve shared the sheet with your service account’s client_email.'
      )
    } else {
      console.error('❌ Sheets append error:', err.message)
    }
  }
}