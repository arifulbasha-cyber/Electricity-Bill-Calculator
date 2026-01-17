
import React, { useState } from 'react';
import { useLanguage } from '../i18n';
import { X, AlertCircle, FileSpreadsheet, Copy, Check, ExternalLink } from 'lucide-react';
import { spreadsheetService } from '../services/spreadsheet';

interface CloudSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

const APPS_SCRIPT_CODE = `/**
 * TMSS Bill Splitter - Backend Service v2.1
 * Updated with robust action handling.
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
        if (sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1);
        if (Array.isArray(payload) && payload.length > 0) {
          var rows = payload.map(function(bill) { return [new Date(), bill.id, JSON.stringify(bill)]; });
          sheet.getRange(2, 1, rows.length, 3).setValues(rows);
        }
        return jsonResponse({ status: 'success' });
      case 'saveSettings':
        var sheet = getOrCreateSheet(ss, 'saveSettings', ['Key', 'Data', 'Last Updated']);
        updateOrInsertSetting(sheet, payload.key, JSON.stringify(payload.data));
        return jsonResponse({ status: 'success' });
      default:
        return jsonResponse({ status: 'error', message: 'Unknown action: "' + action + '". Please create a NEW DEPLOYMENT in Apps Script.' });
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
        return jsonResponse(sheet.getDataRange().getValues()); 
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
  for (var i = 1; i < values.length; i++) { if (values[i][0] == key) { rowIndex = i + 1; break; } }
  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 2).setValue(data);
    sheet.getRange(rowIndex, 3).setValue(new Date());
  } else { sheet.appendRow([key, data, new Date()]); }
}

function getSettingByKey(sheet, key) {
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) { if (values[i][0] == key) return values[i][1]; }
  return null;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}`;

const CloudSetupModal: React.FC<CloudSetupModalProps> = ({ isOpen, onClose, onConnected }) => {
  const { t } = useLanguage();
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const isReady = spreadsheetService.isReady();

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async () => {
    setError(null);
    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith('https://script.google.com/')) {
      setError("Please provide a valid Google Apps Script Web App URL.");
      return;
    }
    
    try {
      spreadsheetService.setConfig({ webAppUrl: cleanUrl });
      onConnected();
      onClose();
    } catch (e: any) {
      setError("Failed to save configuration.");
    }
  };

  const handleDisconnect = () => {
    if (window.confirm("Disconnect from Google Sheets? Cloud synchronization will be disabled.")) {
      spreadsheetService.clearConfig();
      onConnected();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600" /> {t('cloud_setup')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Store your data in your own Google Spreadsheet.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-100 dark:border-red-900/50">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
            <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase mb-3 flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" /> Setup Steps:
            </h3>
            <ol className="list-decimal list-inside text-xs text-slate-700 dark:text-slate-300 space-y-2 mb-4 leading-relaxed">
              <li>Open a <strong>Google Spreadsheet</strong>.</li>
              <li>Go to <strong>Extensions &gt; Apps Script</strong>.</li>
              <li>Delete all code and paste the script below.</li>
              <li>Click <strong>Deploy &gt; New Deployment</strong>.</li>
              <li>Set "Who has access" to <strong>Anyone</strong>.</li>
              <li>Copy the <strong>Web App URL</strong> and paste it below.</li>
            </ol>
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-widest leading-tight">
                ⚠️ CRITICAL: If you get "Unknown Action", it means you didn't click "New Deployment" after updating the code.
              </p>
            </div>
            
            <button 
              onClick={handleCopyCode}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest hover:bg-emerald-50 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Code Copied!' : 'Copy Script Code'}
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Web App Exec URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition-all"
              placeholder="https://script.google.com/macros/s/.../exec"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
          {isReady && (
            <button onClick={handleDisconnect} className="px-4 py-2 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
              Disconnect
            </button>
          )}
          <button 
            disabled={!url.trim()}
            onClick={handleConnect}
            className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all active:scale-95"
          >
            {isReady ? 'Update Connection' : 'Connect Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloudSetupModal;
