
/**
 * TMSS Bill Splitter - Backend Service v2.1
 * 
 * IMPORTANT: After pasting this code, you MUST:
 * 1. Click 'Save'
 * 2. Click 'Deploy' > 'New Deployment'
 * 3. Select 'Web App', set 'Who has access' to 'Anyone'
 * 4. Copy the NEW URL provided.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 
    
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    var action = (data.action || "").toString().trim();
    var payload = data.payload;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (!ss) throw new Error("Spreadsheet not found.");

    switch(action) {
      case 'saveBill':
        var sheet = getOrCreateSheet(ss, 'saveBill', ['Timestamp', 'ID', 'Data']);
        sheet.appendRow([new Date(), payload.id, JSON.stringify(payload)]);
        return jsonResponse({ status: 'success' });

      case 'saveHistory':
        var sheet = getOrCreateSheet(ss, 'saveBill', ['Timestamp', 'ID', 'Data']);
        if (sheet.getLastRow() > 1) {
          sheet.deleteRows(2, sheet.getLastRow() - 1);
        }
        if (Array.isArray(payload) && payload.length > 0) {
          var rows = payload.map(function(bill) {
            return [new Date(), bill.id, JSON.stringify(bill)];
          });
          sheet.getRange(2, 1, rows.length, 3).setValues(rows);
        }
        return jsonResponse({ status: 'success' });

      case 'saveSettings':
        var sheet = getOrCreateSheet(ss, 'saveSettings', ['Key', 'Data', 'Last Updated']);
        updateOrInsertSetting(sheet, payload.key, JSON.stringify(payload.data));
        return jsonResponse({ status: 'success' });

      default:
        return jsonResponse({ status: 'error', message: 'Unknown action: "' + action + '". Please ensure you have created a NEW DEPLOYMENT in Apps Script.' });
    }
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    var action = (e.parameter.action || "").toString().trim();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error("Spreadsheet context missing.");

    switch(action) {
      case 'getBills':
        var sheet = ss.getSheetByName('saveBill');
        if (!sheet) return jsonResponse([]);
        var values = sheet.getDataRange().getValues();
        return jsonResponse(values); 

      case 'getSettings':
        var key = e.parameter.key;
        var sheet = ss.getSheetByName('saveSettings');
        if (!sheet) return jsonResponse(null);
        var data = getSettingByKey(sheet, key);
        return jsonResponse(data ? JSON.parse(data) : null);

      case 'version':
        return jsonResponse({ version: '2.1', status: 'ready' });

      default:
        return jsonResponse({ status: 'error', message: 'Invalid action: ' + action });
    }
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#e2e8f0');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function updateOrInsertSetting(sheet, key, data) {
  var values = sheet.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] == key) { rowIndex = i + 1; break; }
  }
  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 2).setValue(data);
    sheet.getRange(rowIndex, 3).setValue(new Date());
  } else {
    sheet.appendRow([key, data, new Date()]);
  }
}

function getSettingByKey(sheet, key) {
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] == key) return values[i][1];
  }
  return null;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
