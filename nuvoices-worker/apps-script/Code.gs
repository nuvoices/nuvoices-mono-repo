/**
 * Google Sheets to Cloudflare Worker Sync
 *
 * This Apps Script syncs Google Sheets data to a Cloudflare Worker endpoint
 * using time-driven triggers (every 2 minutes).
 *
 * Setup:
 * 1. Copy this code to Tools > Script editor in your Google Sheet
 * 2. Run 'setupSync' from the menu: Sync > Setup Sync
 * 3. Configure your worker URL when prompted
 * 4. The script will create a time-driven trigger automatically
 */

// Configuration keys for PropertiesService
const CONFIG_KEYS = {
  WORKER_URL: 'WORKER_URL',
  LAST_SYNC_TIME: 'LAST_SYNC_TIME',
  SHEET_NAME: 'SHEET_NAME'
};

/**
 * Creates custom menu when spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Sync')
    .addItem('Setup Sync', 'setupSync')
    .addItem('Sync Now (Full)', 'syncNowFull')
    .addItem('View Sync Status', 'showSyncStatus')
    .addItem('Clear Configuration', 'clearConfig')
    .addToUi();
}

/**
 * Setup sync configuration and create time-driven trigger
 */
function setupSync() {
  const ui = SpreadsheetApp.getUi();

  // Get worker URL from user
  const urlResponse = ui.prompt(
    'Worker URL',
    'Enter your Cloudflare Worker URL (e.g., https://your-worker.workers.dev/sheets-webhook):',
    ui.ButtonSet.OK_CANCEL
  );

  if (urlResponse.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const workerUrl = urlResponse.getResponseText().trim();

  if (!workerUrl || !workerUrl.startsWith('http')) {
    ui.alert('Error', 'Invalid URL. Please provide a valid HTTPS URL.', ui.ButtonSet.OK);
    return;
  }

  // Get sheet name (default to first sheet)
  const sheetName = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getName();

  // Save configuration
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty(CONFIG_KEYS.WORKER_URL, workerUrl);
  properties.setProperty(CONFIG_KEYS.SHEET_NAME, sheetName);

  // Delete existing triggers to avoid duplicates
  deleteExistingTriggers();

  // Create time-driven trigger (every 2 minutes)
  ScriptApp.newTrigger('syncToWorker')
    .timeBased()
    .everyMinutes(2)
    .create();

  ui.alert(
    'Setup Complete',
    `Sync configured successfully!\n\n` +
    `Worker URL: ${workerUrl}\n` +
    `Sheet: ${sheetName}\n` +
    `Sync frequency: Every 2 minutes\n\n` +
    `The first sync will run in ~2 minutes.`,
    ui.ButtonSet.OK
  );

  Logger.log('Sync setup complete: ' + workerUrl);
}

/**
 * Delete all existing time-driven triggers for syncToWorker
 */
function deleteExistingTriggers() {
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'syncToWorker') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

/**
 * Main sync function (called by time-driven trigger)
 */
function syncToWorker() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const workerUrl = properties.getProperty(CONFIG_KEYS.WORKER_URL);
    const sheetName = properties.getProperty(CONFIG_KEYS.SHEET_NAME);

    if (!workerUrl) {
      Logger.log('Worker URL not configured. Run setupSync first.');
      return;
    }

    // Get sheet data
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = sheetName ? spreadsheet.getSheetByName(sheetName) : spreadsheet.getActiveSheet();

    if (!sheet) {
      Logger.log('Sheet not found: ' + sheetName);
      return;
    }

    // Get all data from sheet
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      Logger.log('No data to sync (only headers or empty sheet)');
      return;
    }

    // Parse headers (first row)
    const headers = data[0];

    // Convert rows to records
    const records = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const fields = {};

      // Map each cell to its header
      headers.forEach((header, index) => {
        if (header && row[index] !== undefined && row[index] !== '') {
          fields[header] = row[index];
        }
      });

      // Only include rows with at least one field
      if (Object.keys(fields).length > 0) {
        records.push({
          id: `row_${i + 1}`, // Row number (1-indexed, +1 for header)
          fields: fields,
          createdTime: new Date().toISOString()
        });
      }
    }

    if (records.length === 0) {
      Logger.log('No valid records to sync');
      return;
    }

    // Prepare payload
    const payload = {
      spreadsheetId: spreadsheet.getId(),
      sheetName: sheet.getName(),
      records: records,
      timestamp: new Date().toISOString(),
      action: 'batch_update'
    };

    // Send to worker
    const response = UrlFetchApp.fetch(workerUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode === 200) {
      properties.setProperty(CONFIG_KEYS.LAST_SYNC_TIME, new Date().toISOString());
      Logger.log(`Sync successful: ${records.length} records synced`);
      Logger.log('Response: ' + responseBody);
    } else {
      Logger.log(`Sync failed with status ${responseCode}: ${responseBody}`);
    }

  } catch (error) {
    Logger.log('Sync error: ' + error.toString());
  }
}

/**
 * Manual full sync (triggered from menu)
 */
function syncNowFull() {
  const ui = SpreadsheetApp.getUi();
  const properties = PropertiesService.getScriptProperties();
  const workerUrl = properties.getProperty(CONFIG_KEYS.WORKER_URL);

  if (!workerUrl) {
    ui.alert('Error', 'Sync not configured. Please run "Setup Sync" first.', ui.ButtonSet.OK);
    return;
  }

  const result = ui.alert(
    'Full Sync',
    'This will replace ALL data in the worker with current sheet data. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (result !== ui.Button.YES) {
    return;
  }

  try {
    const sheetName = properties.getProperty(CONFIG_KEYS.SHEET_NAME);
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = sheetName ? spreadsheet.getSheetByName(sheetName) : spreadsheet.getActiveSheet();

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const records = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const fields = {};

      headers.forEach((header, index) => {
        if (header && row[index] !== undefined && row[index] !== '') {
          fields[header] = row[index];
        }
      });

      if (Object.keys(fields).length > 0) {
        records.push({
          id: `row_${i + 1}`,
          fields: fields,
          createdTime: new Date().toISOString()
        });
      }
    }

    const payload = {
      spreadsheetId: spreadsheet.getId(),
      sheetName: sheet.getName(),
      records: records,
      timestamp: new Date().toISOString(),
      action: 'full_sync'
    };

    const response = UrlFetchApp.fetch(workerUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode === 200) {
      properties.setProperty(CONFIG_KEYS.LAST_SYNC_TIME, new Date().toISOString());
      ui.alert('Success', `Full sync completed!\n\n${records.length} records synced.`, ui.ButtonSet.OK);
    } else {
      ui.alert('Error', `Sync failed (${responseCode}): ${responseBody}`, ui.ButtonSet.OK);
    }

  } catch (error) {
    ui.alert('Error', 'Sync failed: ' + error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Show sync status
 */
function showSyncStatus() {
  const ui = SpreadsheetApp.getUi();
  const properties = PropertiesService.getScriptProperties();

  const workerUrl = properties.getProperty(CONFIG_KEYS.WORKER_URL) || 'Not configured';
  const sheetName = properties.getProperty(CONFIG_KEYS.SHEET_NAME) || 'Not configured';
  const lastSync = properties.getProperty(CONFIG_KEYS.LAST_SYNC_TIME) || 'Never';

  // Check for active triggers
  const triggers = ScriptApp.getProjectTriggers();
  const syncTrigger = triggers.find(t => t.getHandlerFunction() === 'syncToWorker');
  const triggerStatus = syncTrigger ? 'Active (every 2 minutes)' : 'Not configured';

  ui.alert(
    'Sync Status',
    `Worker URL: ${workerUrl}\n` +
    `Sheet: ${sheetName}\n` +
    `Trigger: ${triggerStatus}\n` +
    `Last sync: ${lastSync}`,
    ui.ButtonSet.OK
  );
}

/**
 * Clear all configuration and triggers
 */
function clearConfig() {
  const ui = SpreadsheetApp.getUi();

  const result = ui.alert(
    'Clear Configuration',
    'This will remove all sync settings and triggers. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (result !== ui.Button.YES) {
    return;
  }

  // Delete triggers
  deleteExistingTriggers();

  // Clear properties
  PropertiesService.getScriptProperties().deleteAllProperties();

  ui.alert('Success', 'All sync configuration and triggers have been removed.', ui.ButtonSet.OK);
}
