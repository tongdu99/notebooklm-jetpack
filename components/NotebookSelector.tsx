import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ExternalLink, RefreshCw, BookOpen } from 'lucide-react';
import type { NotebookInfo } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

interface NotebookData {
  current: NotebookInfo | null;
  notebooks: NotebookInfo[];
}

export function NotebookSelector() {
  const { t } = useI18n();
  const [data, setData] = useState<NotebookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchNotebooks = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await chrome.runtime.sendMessage({ type: 'GET_NOTEBOOKS' });
      if (resp?.success) {
        setData(resp.data as NotebookData);
      }
    } catch {
      // No NotebookLM tabs open
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotebooks();
  }, [fetchNotebooks]);

  const activeNotebook = data?.current || null;
  const notebooks = data?.notebooks || [];

  const handleOpenNotebook = (url: string) => {
    chrome.tabs.create({ url });
    setOpen(false);
  };

  // No NotebookLM tabs open
  if (!data || notebooks.length === 0) {
    return (
      <div className="bg-surface-sunken rounded-xl p-3 shadow-soft">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-notebooklm-blue flex-shrink-0" />
          <span className="flex-1 text-sm text-gray-500">
            {t('notebook.noNotebook')}
          </span>
          <button
            onClick={() => chrome.tabs.create({ url: 'https://notebooklm.google.com' })}
            className="btn-press flex items-center gap-1 px-2.5 py-1.5 bg-notebooklm-blue text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {t('notebook.open')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-sunken rounded-xl shadow-soft overflow-hidden">
      {/* Current notebook display */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <BookOpen className="w-4 h-4 text-notebooklm-blue flex-shrink-0" />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs text-gray-400">{t('notebook.current')}</p>
          <p className="text-sm font-medium text-gray-800 truncate">
            {activeNotebook?.title || notebooks[0]?.title || 'NotebookLM'}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              fetchNotebooks();
            }}
            className="p-1 text-gray-400 hover:text-notebooklm-blue rounded transition-colors"
            title={t('notebook.refresh')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {activeNotebook && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenNotebook(activeNotebook.url);
              }}
              className="p-1 text-gray-400 hover:text-notebooklm-blue rounded transition-colors"
              title={t('notebook.openInTab')}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Notebook list dropdown */}
      {open && notebooks.length > 1 && (
        <div className="border-t border-gray-100 max-h-[200px] overflow-y-auto">
          {notebooks.map((nb) => (
            <button
              key={nb.id}
              onClick={() => handleOpenNotebook(nb.url)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-blue-50/50 transition-colors ${
                nb.id === activeNotebook?.id ? 'bg-blue-50/30' : ''
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 flex-shrink-0 ${
                nb.id === activeNotebook?.id ? 'text-notebooklm-blue' : 'text-gray-400'
              }`} />
              <span className={`text-xs truncate ${
                nb.id === activeNotebook?.id ? 'text-notebooklm-blue font-medium' : 'text-gray-600'
              }`}>
                {nb.title}
              </span>
              {nb.id === activeNotebook?.id && (
                <span className="ml-auto text-[10px] text-notebooklm-blue bg-blue-50 px-1.5 py-0.5 rounded">
                  {t('notebook.active')}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
