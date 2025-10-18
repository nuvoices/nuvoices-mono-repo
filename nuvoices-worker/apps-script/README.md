# Google Sheets Apps Script Setup

This folder contains the Google Apps Script code for syncing Google Sheets data to your Cloudflare Worker.

## Features

- **Time-driven sync**: Automatically syncs every 2 minutes
- **Full sync support**: Manual trigger to replace all data
- **Easy setup**: Simple menu-driven configuration
- **No OAuth complexity**: Uses Apps Script's built-in authorization
- **Rate limit friendly**: Designed to stay within Google's limits

## Installation

### Step 1: Open Script Editor

1. Open your Google Sheet
2. Go to **Extensions > Apps Script**
3. Delete any existing code in the editor

### Step 2: Copy Code

1. Copy the contents of `Code.gs` from this folder
2. Paste it into the Apps Script editor
3. Save the project (File > Save or Ctrl/Cmd+S)

### Step 3: Copy Configuration

1. In the Apps Script editor, click the **Project Settings** (gear icon)
2. Scroll down to **Script Properties**
3. Or simply copy the `appsscript.json` file:
   - Click the **gear icon** (Project Settings)
   - Copy the contents of `appsscript.json` from this folder
   - Replace the existing configuration

### Step 4: Configure Sync

1. Refresh your Google Sheet
2. You should see a new **"Sync"** menu appear
3. Click **Sync > Setup Sync**
4. When prompted, enter your Cloudflare Worker URL:
   ```
   https://your-worker.workers.dev/sheets-webhook
   ```
5. Authorize the script when prompted (Google will ask for permissions)

### Step 5: Verify

1. Click **Sync > View Sync Status** to check configuration
2. Wait 2 minutes for the first automatic sync
3. Or click **Sync > Sync Now (Full)** to trigger an immediate full sync

## Menu Options

### Sync > Setup Sync
- Configure worker URL and sheet name
- Creates time-driven trigger (every 2 minutes)

### Sync > Sync Now (Full)
- Manually trigger a full sync
- Replaces ALL data in the worker
- Useful for initial setup or after major changes

### Sync > View Sync Status
- Shows current configuration
- Displays last sync time
- Checks trigger status

### Sync > Clear Configuration
- Removes all settings and triggers
- Use this to reset the sync setup

## How It Works

1. **Time-driven trigger** runs `syncToWorker()` every 2 minutes
2. Script reads all data from the configured sheet
3. Converts rows to JSON records (first row = headers)
4. Sends POST request to `/sheets-webhook` endpoint
5. Worker updates D1 database with the data

## Data Format

The script sends data in this format:

```json
{
  "spreadsheetId": "abc123...",
  "sheetName": "Sheet1",
  "records": [
    {
      "id": "row_2",
      "fields": {
        "Name": "John Doe",
        "Email": "john@example.com",
        "Status": "Active"
      },
      "createdTime": "2024-01-01T12:00:00.000Z"
    }
  ],
  "timestamp": "2024-01-01T12:00:00.000Z",
  "action": "batch_update"
}
```

### Full Sync vs Batch Update

- **batch_update**: Upserts records (default for automatic syncs)
- **full_sync**: Drops table and recreates (manual sync only)

## Rate Limits

Google Apps Script limits:
- **URL fetch calls**: 20,000/day (consumer accounts)
- **Execution time**: 6 minutes max per execution
- **Trigger frequency**: Every 1-2 minutes recommended

With 2-minute syncs:
- **720 syncs/day** (well under 20,000 limit)
- Each sync completes in seconds

## Troubleshooting

### "Worker URL not configured"
- Run **Sync > Setup Sync** to configure the worker URL

### "No data to sync"
- Ensure your sheet has headers in row 1
- Add at least one data row

### "Sync failed"
- Check worker URL is correct
- Verify worker is deployed and accessible
- Check Apps Script logs: **View > Logs**

### Trigger not running
- Go to **Apps Script > Triggers** (clock icon)
- Verify "syncToWorker" trigger exists
- Delete and recreate via **Setup Sync** if needed

## Security Notes

- Worker URL is stored in Script Properties (private to script)
- Only authorized users can run the script
- Data is sent over HTTPS
- Consider adding authentication to your worker endpoint for production

## Logs

To view sync logs:
1. Open Apps Script editor
2. Click **View > Logs** (or **Execution log**)
3. See sync status, errors, and timestamps
