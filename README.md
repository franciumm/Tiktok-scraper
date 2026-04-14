# 📊 TikTok Analytics Scraper

A powerful and automated Node.js tool designed to fetch and log analytics data directly from the TikTok Creator Center. This tool periodically fetches crucial metrics such as followers, unique viewers, search terms, and traffic sources, and seamlessly exports them into a smartly structured Excel spreadsheet.

## 🌟 Features

- **Automated Data Fetching**: Retrieves your TikTok account's analytics using `node-cron`, keeping your data up-to-date.
- **Rich Insight Metrics Supported**:
  - Follower Count
  - Unique Viewer Metrics
  - User Search Terms
  - Traffic Sources (Video Page Percentages)
  - Incentive Post Views (VV) Status
- **Automated Excel Export**: Generates and updates an `analytics.xlsx` file with organized, readable tabs (`Overview`, `Traffic Sources`, `Search Terms`).
- **Cookie-Based Authentication**: Leverages standard session cookies to authorize requests to TikTok's insight APIs.

## 🛠️ Tech Stack

- **[Node.js](https://nodejs.org/)** (ES Modules)
- **`axios`**: For making fast, asynchronous HTTP requests.
- **`exceljs`**: For reading, writing, and formatting Excel workbooks perfectly.
- **`node-cron`**: For flexible and automated job scheduling.

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your target machine:
- [Node.js](https://nodejs.org/) (v16.x or newer is recommended)

### 1. Installation

Clone the repository and install the dependencies:
```bash
# Clone the repository
git clone <your_repository_url>
cd Tiktok-scraper

# Install dependencies
npm install
```

### 2. Configure Authentication (Crucial Step)

The scraper requires an active session cookie to communicate with TikTok:
1. Open your web browser and log into the **TikTok Creator Center**.
2. Export your session cookies (you can use browser extensions like *EditThisCookie*, *Cookie-Editor*, or directly via DevTools) into a strictly valid JSON array format.
3. Save the JSON data into a file named **`cookies.json`** in the project's root directory.
   *(Note: Ensure your `cookies.json` matches the standard cookie schema containing `name` and `value` fields).*

### 3. Usage

Run the project locally:
```bash
npm run dev
```

**How it works**: 
Upon starting, the main orchestrator (`src/index.js`) executes the scraping task immediately and subsequently schedules it to run securely every hour via `node-cron`. The output payload is carefully parsed and appended into your `analytics.xlsx` continuously!

## 📁 Key File Structure

```text
Tiktok-scraper/
├── cookies.json            # 🔑 Your TikTok session cookies (Add this file!)
├── analytics.xlsx          # 📈 Auto-generated Excel data output (Created on run)
├── package.json            # Node.js dependencies and scripts
└── src/
    ├── index.js            # Main entry point and cron job definition
    └── Operate/
        └── controller.js   # Core logic: fetching endpoints & writing to Excel
```

## ⚠️ Important Considerations

- **API Nuances**: This scraper relies on TikTok's internal insights API which can update occasionally. Ensure your `device_id` and `user-agent` in `src/Operate/controller.js` are reasonably synchronized with the browser used to fetch your `cookies.json`.
- **Security**: Do not commit your sensible data. It is highly recommended to add `cookies.json` and `analytics.xlsx` to your project's `.gitignore` file.
