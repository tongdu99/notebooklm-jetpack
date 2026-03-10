import { useState, useEffect, useRef } from 'react';
import { toJpeg, toPng, toCanvas, toBlob } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import type { QAPair } from '@/lib/types';

const QR_URL = 'https://youtu.be/9gPTuJZRHJk';

interface ShareCardData {
  pairs: QAPair[];
  title: string;
  platform: string;
  platformIcon: string;
  url: string;
}

/** Detect Chinese locale */
function isZh(): boolean {
  return navigator.language.startsWith('zh');
}

/** Bilingual strings */
const i18n = {
  question: () => isZh() ? '提问' : 'Question',
  answer: () => isZh() ? '回答' : 'Answer',
  madeWith: () => isZh()
    ? 'Made with ❤️ by 绿皮火车'
    : 'Made with ❤️ by Green Train Podcast',
  platformLabel: (key: string, fallback: string) => {
    const zh: Record<string, string> = {
      claude: 'Claude · AI 对话',
      chatgpt: 'ChatGPT · AI 对话',
      gemini: 'Gemini · AI 对话',
    };
    const en: Record<string, string> = {
      claude: 'Claude · AI Conversation',
      chatgpt: 'ChatGPT · AI Conversation',
      gemini: 'Gemini · AI Conversation',
    };
    const dict = isZh() ? zh : en;
    return dict[key] || `${fallback} · AI`;
  },
};

type ExportFormat = 'jpeg' | 'png' | 'pdf' | 'clipboard';

export function ShareCardApp() {
  const [data, setData] = useState<ShareCardData | null>(null);
  const [saving, setSaving] = useState(false);
  const [showIsland, setShowIsland] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chrome.storage.local.get('shareCardData', (result) => {
      if (result.shareCardData) {
        setData(result.shareCardData);
        chrome.storage.local.remove('shareCardData');
      }
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filename = data?.title || 'share-card';
  const pixelRatio = 3;

  const handleSave = async (format: ExportFormat = 'jpeg') => {
    if (!cardRef.current) return;
    setSaving(true);
    setShowDropdown(false);
    try {
      if (format === 'jpeg') {
        const dataUrl = await toJpeg(cardRef.current, {
          pixelRatio,
          cacheBust: true,
          quality: 0.92,
          backgroundColor: '#f6f1ea',
        });
        downloadDataUrl(dataUrl, `${filename}.jpg`);
      } else if (format === 'png') {
        const dataUrl = await toPng(cardRef.current, {
          pixelRatio,
          cacheBust: true,
        });
        downloadDataUrl(dataUrl, `${filename}.png`);
      } else if (format === 'pdf') {
        const canvas = await toCanvas(cardRef.current, {
          pixelRatio,
          cacheBust: true,
        });
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        // PDF page sized to card aspect ratio (in mm)
        const pdfWidth = 100;
        const pdfHeight = (imgHeight / imgWidth) * pdfWidth;
        const pdf = new jsPDF({
          orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
          unit: 'mm',
          format: [pdfWidth, pdfHeight],
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${filename}.pdf`);
      } else if (format === 'clipboard') {
        const blob = await toBlob(cardRef.current, {
          pixelRatio,
          cacheBust: true,
        });
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to save card:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return (
      <div className="loading">
        <p>Loading...</p>
      </div>
    );
  }

  const platformKey = data.platform?.toLowerCase() || '';
  const platformLabel = i18n.platformLabel(platformKey, data.platform);

  return (
    <div className="page">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="save-group" ref={dropdownRef}>
          <button
            onClick={() => handleSave('jpeg')}
            disabled={saving}
            className="save-btn"
          >
            {saving ? 'Saving\u2026' : 'Save JPEG'}
          </button>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={saving}
            className="save-btn save-dropdown-toggle"
            aria-label="More formats"
          >
            ▾
          </button>
          {showDropdown && (
            <div className="save-dropdown">
              <button onClick={() => handleSave('png')}>PNG</button>
              <button onClick={() => handleSave('pdf')}>PDF</button>
              <button onClick={() => handleSave('clipboard')}>Clipboard</button>
            </div>
          )}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showIsland}
            onChange={(e) => setShowIsland(e.target.checked)}
            style={{ accentColor: '#c4553a' }}
          />
          <span className="hint">Dynamic Island</span>
        </label>
        <span className="hint" style={{ marginLeft: 'auto' }}>3x retina</span>
      </div>

      {/* Card preview */}
      <div className="card-wrapper">
        <div ref={cardRef} className="card">
          {/* Safe area for Dynamic Island */}
          {showIsland && (
            <div className="card-safe-area">
              <div className="dynamic-island" />
            </div>
          )}

          {/* Header */}
          <div className="card-header" style={!showIsland ? { paddingTop: 28 } : undefined}>
            <div className="platform-label">{platformLabel}</div>
            <h1 className="card-title">{data.title}</h1>
          </div>

          {/* Q&A pairs */}
          <div className="pairs">
            {data.pairs.map((pair, i) => (
              <div key={pair.id}>
                <div className="pair">
                  {pair.question && (
                    <div className="question-block">
                      <div className="role-label">{i18n.question()}</div>
                      <p className="question-text">{pair.question}</p>
                    </div>
                  )}
                  {pair.answer && (
                    <div className="answer-block">
                      <div className="answer-label">{i18n.answer()}</div>
                      <p className="answer-text">{formatAnswer(pair.answer)}</p>
                    </div>
                  )}
                </div>
                {i < data.pairs.length - 1 && (
                  <div className="pair-divider">· · ·</div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="card-footer">
            <div className="footer-left">
              <span className="footer-brand">NotebookLM Jetpack</span>
              <span className="footer-made-with">{i18n.madeWith()}</span>
            </div>
            <div className="footer-qr">
              <QRCodeSVG
                value={QR_URL}
                size={52}
                bgColor="transparent"
                fgColor="#8a7e70"
                level="M"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/** Truncate long answers for card display */
function formatAnswer(text: string): string {
  let clean = text
    .replace(/```[\s\S]*?```/g, '[code block]')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n');

  if (clean.length > 600) {
    clean = clean.slice(0, 600).trimEnd() + '…';
  }
  return clean;
}
