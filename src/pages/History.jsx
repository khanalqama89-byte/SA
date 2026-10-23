import React, { useState, useEffect } from 'react';
import { conversionService } from '../services/conversionService';
import { formatDate } from '../utils/formatters';
import { History, Download, Trash2, Search, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await conversionService.getHistory();
      setHistoryItems(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch conversion history.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this history entry?')) return;
    try {
      await conversionService.deleteHistory(id);
      setHistoryItems(historyItems.filter(item => item.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete entry');
    }
  };

  const handleDownload = async (jobId, outputFileName) => {
    try {
      await conversionService.downloadResult(jobId, outputFileName);
    } catch (err) {
      alert(err.message || 'Download failed. The file may have expired.');
    }
  };

  const filtered = historyItems.filter(item =>
    item.toolName.toLowerCase().includes(search.toLowerCase()) ||
    item.sourceFileName.toLowerCase().includes(search.toLowerCase()) ||
    (item.outputFileName && item.outputFileName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="sa-page">
      <div className="sa-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <History size={22} />
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                Conversion History
              </h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
              Track and re-download your recent document conversions.
            </p>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={18} color="var(--text-subtle)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Filter history..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sa-input"
              style={{ paddingLeft: '2.75rem', height: '42px', fontSize: '0.9rem' }}
            />
          </div>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="sa-animate-spin" style={{ width: '36px', height: '36px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>Retrieving your history...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="sa-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <FileText size={48} color="var(--text-subtle)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>No conversion records found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Documents converted while logged in will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="sa-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#475569' }}>Tool</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#475569' }}>Source Document</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#475569' }}>Converted Output</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#475569' }}>Status</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#475569' }}>Date</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1.15rem 1.5rem', fontWeight: 600 }}>
                        {item.toolName}
                      </td>
                      <td style={{ padding: '1.15rem 1.5rem', color: 'var(--text-main)' }}>
                        {item.sourceFileName}
                      </td>
                      <td style={{ padding: '1.15rem 1.5rem', color: 'var(--text-muted)' }}>
                        {item.outputFileName || '—'}
                      </td>
                      <td style={{ padding: '1.15rem 1.5rem' }}>
                        <span className={`sa-badge ${item.status === 'COMPLETED' ? 'sa-badge-success' : 'sa-badge-warning'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '1.15rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {formatDate(item.createdAt)}
                      </td>
                      <td style={{ padding: '1.15rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          {item.status === 'COMPLETED' && (
                            <button
                              onClick={() => handleDownload(item.jobId, item.outputFileName)}
                              className="sa-btn sa-btn-secondary sa-btn-sm"
                              title="Download File"
                            >
                              <Download size={15} />
                              Download
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="sa-btn sa-btn-secondary sa-btn-sm"
                            style={{ color: 'var(--danger)' }}
                            title="Delete Record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
