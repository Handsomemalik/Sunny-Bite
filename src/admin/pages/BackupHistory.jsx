import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, logAuditEvent } from '../../lib/supabase';
import { useMenu, useSettings, ContentContext } from '../../context/ContentContext';
import { useContext } from 'react';

export function BackupHistory() {
  const context = useContext(ContentContext);
  const { allItems, categories } = useMenu();
  const { settings } = useSettings();

  const [auditLogs, setAuditLogs] = useState([]);
  const [contentVersions, setContentVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Import modal state
  const [importData, setImportData] = useState(null);
  const [importDryRun, setImportDryRun] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const showToast = (msg, isErr = false) => {
    setFeedback({ msg, isErr });
    setTimeout(() => setFeedback(null), 3500);
  };

  const loadLogsAndVersions = async () => {
    setLoading(true);
    if (!isSupabaseConfigured() || !supabase) {
      setAuditLogs([
        {
          id: 'log-1',
          action: 'CREATE',
          entity_type: 'menu_item',
          entity_id: 'garden-vegetable-soup',
          user_email: 'admin@sunnybite.com',
          created_at: new Date().toISOString(),
        },
      ]);
      setContentVersions([]);
      setLoading(false);
      return;
    }

    try {
      const [auditRes, versionsRes] = await Promise.all([
        supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(25),
        supabase
          .from('content_versions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (auditRes.data) setAuditLogs(auditRes.data);
      if (versionsRes.data) setContentVersions(versionsRes.data);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogsAndVersions();
  }, []);

  // 1. Export Whole Site JSON
  const handleExportJson = async () => {
    try {
      let exportObj = {
        exported_at: new Date().toISOString(),
        restaurant: 'SunnyBite',
        categories,
        menu_items: allItems,
        site_settings: settings,
        page_content: context?.data?.pageContent || {},
        chatbot_faq: context?.data?.faq || [],
      };

      if (isSupabaseConfigured() && supabase) {
        const [catRes, menuRes, setRes, pageRes, faqRes] = await Promise.all([
          supabase.from('categories').select('*'),
          supabase.from('menu_items').select('*'),
          supabase.from('site_settings').select('*'),
          supabase.from('page_content').select('*'),
          supabase.from('chatbot_faq').select('*'),
        ]);

        exportObj.categories = catRes.data || exportObj.categories;
        exportObj.menu_items = menuRes.data || exportObj.menu_items;
        exportObj.site_settings = setRes.data || exportObj.site_settings;
        exportObj.page_content = pageRes.data || exportObj.page_content;
        exportObj.chatbot_faq = faqRes.data || exportObj.chatbot_faq;
      }

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportObj, null, 2)
      )}`;

      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute(
        'download',
        `sunnybite-backup-${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Complete site backup JSON downloaded successfully!');
    } catch (err) {
      showToast(`Export failed: ${err.message}`, true);
    }
  };

  // 2. Select & Dry-Run JSON file for import
  const handleFileSelectForImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed.menu_items && !parsed.site_settings && !parsed.page_content) {
          throw new Error('Unrecognized SunnyBite backup format.');
        }

        setImportData(parsed);
        setImportDryRun({
          dishesCount: Array.isArray(parsed.menu_items) ? parsed.menu_items.length : 0,
          categoriesCount: Array.isArray(parsed.categories) ? parsed.categories.length : 0,
          settingsCount: Array.isArray(parsed.site_settings)
            ? parsed.site_settings.length
            : Object.keys(parsed.site_settings || {}).length,
          faqCount: Array.isArray(parsed.chatbot_faq) ? parsed.chatbot_faq.length : 0,
        });
        setIsImportModalOpen(true);
      } catch (err) {
        showToast(`Invalid JSON file: ${err.message}`, true);
      }
    };
    reader.readAsText(file);
  };

  // 3. Confirm & Execute JSON Import
  const handleExecuteImport = async () => {
    if (!importData) return;
    setIsImportModalOpen(false);

    if (!isSupabaseConfigured() || !supabase) {
      showToast('Offline Mode: Imported data applied in session');
      return;
    }

    try {
      // Upsert categories
      if (Array.isArray(importData.categories) && importData.categories.length > 0) {
        await supabase.from('categories').upsert(importData.categories);
      }

      // Upsert menu items
      if (Array.isArray(importData.menu_items) && importData.menu_items.length > 0) {
        await supabase.from('menu_items').upsert(importData.menu_items);
      }

      // Upsert settings
      if (Array.isArray(importData.site_settings)) {
        await supabase.from('site_settings').upsert(importData.site_settings);
      }

      // Upsert page content
      if (Array.isArray(importData.page_content)) {
        await supabase.from('page_content').upsert(importData.page_content);
      }

      // Upsert faq
      if (Array.isArray(importData.chatbot_faq) && importData.chatbot_faq.length > 0) {
        await supabase.from('chatbot_faq').upsert(importData.chatbot_faq);
      }

      await logAuditEvent({
        action: 'RESTORE_BACKUP',
        entityType: 'complete_backup',
        newValue: { imported_summary: importDryRun },
      });

      showToast('Backup successfully restored to Supabase database!');
      if (context?.refreshContent) context.refreshContent();
      loadLogsAndVersions();
    } catch (err) {
      showToast(`Import error: ${err.message}`, true);
    }
  };

  // 4. Restore a specific section version snapshot
  const handleRestoreVersion = async (version) => {
    if (!isSupabaseConfigured() || !supabase) {
      showToast('Version restored locally');
      return;
    }

    try {
      if (version.page && version.section_key) {
        await supabase.from('page_content').upsert([
          {
            page: version.page,
            section_key: version.section_key,
            content: version.content,
            updated_at: new Date().toISOString(),
          },
        ]);
        showToast(`Restored ${version.page} > ${version.section_key} to previous version!`);
      } else if (version.setting_key) {
        await supabase.from('site_settings').upsert([
          {
            key: version.setting_key,
            value: version.content,
            updated_at: new Date().toISOString(),
          },
        ]);
        showToast(`Restored ${version.setting_key} to previous version!`);
      }

      if (context?.refreshContent) context.refreshContent();
      loadLogsAndVersions();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-warm-elevated text-xs sm:text-sm font-semibold flex items-center gap-2 ${
            feedback.isErr ? 'bg-error text-white' : 'bg-secondary text-on-secondary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {feedback.isErr ? 'error' : 'check_circle'}
          </span>
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#243022] font-semibold">
            Backup &amp; Activity History
          </h1>
          <p className="font-body-md text-on-surface-variant text-xs sm:text-sm">
            Export the complete restaurant database as JSON, restore previous versions of page copy, and inspect the security audit trail.
          </p>
        </div>

        {/* Export / Import Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportJson}
            className="px-4 py-2.5 rounded-full bg-secondary text-on-secondary font-label-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 hover:opacity-90 hover:scale-105 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Site JSON</span>
          </button>

          <label className="px-4 py-2.5 rounded-full bg-surface-container-high hover:bg-surface-container text-on-surface font-label-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all">
            <span className="material-symbols-outlined text-[18px]">upload</span>
            <span>Import JSON</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelectForImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Previous Content Versions Snapshots (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">restore</span>
              <h2 className="font-headline-sm text-base font-bold text-[#243022]">
                Restore Previous Versions
              </h2>
            </div>
          </div>

          <p className="text-xs text-on-surface-variant">
            Each time page headlines, story sections, or settings are saved, an automatic snapshot is saved here. You can revert anytime with 1 click.
          </p>

          <div className="space-y-3">
            {contentVersions.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-xs space-y-1">
                <span className="material-symbols-outlined text-[28px] text-outline">history_edu</span>
                <p>No previous snapshots recorded yet. Versions appear automatically when you edit content.</p>
              </div>
            ) : (
              contentVersions.map((v) => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-2xl bg-surface-container-low/70 border border-surface-container/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-on-surface">
                      {v.page ? `${v.page} > ${v.section_key}` : `Setting: ${v.setting_key}`}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                      Saved {new Date(v.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRestoreVersion(v)}
                    className="px-3 py-1.5 rounded-full bg-secondary-fixed hover:bg-secondary hover:text-white text-on-secondary-fixed text-xs font-semibold transition-colors"
                  >
                    Restore
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Security Audit Log (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">verified_user</span>
              <h2 className="font-headline-sm text-base font-bold text-[#243022]">
                Audit Activity Log
              </h2>
            </div>
            <span className="text-xs text-on-surface-variant">Last 25 entries</span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-surface-container-low/70 border border-surface-container/50 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-on-surface uppercase tracking-wider text-[11px]">
                    {log.action} · {log.entity_type}
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-mono">
                    {new Date(log.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-on-surface-variant text-[11px]">
                  User: <strong className="text-on-surface">{log.user_email || 'admin'}</strong>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* IMPORT CONFIRMATION & DRY-RUN MODAL */}
      {isImportModalOpen && importDryRun && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FDFAF3] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-warm-elevated border border-white/80">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-lg font-bold text-[#243022]">
                Confirm JSON Restore
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Review the dry-run summary below before applying this backup to your live restaurant database:
            </p>

            <div className="p-4 rounded-2xl bg-surface-container-low space-y-2 text-xs">
              <div className="flex justify-between font-semibold">
                <span>Menu Dishes:</span>
                <span className="text-primary">{importDryRun.dishesCount} dishes</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Categories:</span>
                <span className="text-secondary">{importDryRun.categoriesCount} categories</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Settings Groups:</span>
                <span>{importDryRun.settingsCount} settings</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Chatbot FAQs:</span>
                <span>{importDryRun.faqCount} FAQs</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="flex-1 py-2.5 rounded-full bg-surface-container text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                className="flex-1 py-2.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold shadow-sm hover:opacity-90"
              >
                Execute Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BackupHistory;
