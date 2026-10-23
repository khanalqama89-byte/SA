import React, { useState, useEffect } from 'react';
import { toolService } from '../services/toolService';
import { formatDate } from '../utils/formatters';
import { LayoutDashboard, Users, FileText, CheckCircle2, AlertTriangle, Layers, Power, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [tools, setTools] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('TOOLS'); // 'TOOLS' | 'JOBS'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, toolsData, jobsData] = await Promise.all([
        toolService.adminGetStats().catch(() => ({})),
        toolService.getTools().catch(() => []),
        toolService.adminGetJobs().catch(() => [])
      ]);
      setStats(statsData || {});
      setTools(toolsData || []);
      setJobs(jobsData || []);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTool = async (id, currentEnabled) => {
    try {
      const updated = await toolService.adminToggleTool(id, !currentEnabled);
      setTools(tools.map(t => t.id === id ? { ...t, enabled: !currentEnabled } : t));
    } catch (err) {
      alert(err.message || 'Failed to toggle tool status');
    }
  };

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
                <LayoutDashboard size={22} />
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                Admin Operations
              </h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
              Real-time platform metrics, tool management, and conversion job queue inspection.
            </p>
          </div>

          <button onClick={loadData} className="sa-btn sa-btn-secondary sa-btn-sm">
            <RefreshCw size={15} />
            Refresh Data
          </button>
        </div>

        {/* Platform Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}>
          <div className="sa-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Users</span>
              <Users size={18} color="var(--primary)" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats?.totalUsers ?? '0'}</div>
          </div>

          <div className="sa-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Jobs</span>
              <FileText size={18} color="#0891b2" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats?.totalJobs ?? '0'}</div>
          </div>

          <div className="sa-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Completed</span>
              <CheckCircle2 size={18} color="var(--success)" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>{stats?.completedJobs ?? '0'}</div>
          </div>

          <div className="sa-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Failed Jobs</span>
              <AlertTriangle size={18} color="var(--danger)" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger)' }}>{stats?.failedJobs ?? '0'}</div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('TOOLS')}
            className={`sa-btn sa-btn-sm ${activeTab === 'TOOLS' ? 'sa-btn-primary' : 'sa-btn-secondary'}`}
          >
            <Layers size={16} />
            Conversion Tools ({tools.length})
          </button>
          <button
            onClick={() => setActiveTab('JOBS')}
            className={`sa-btn sa-btn-sm ${activeTab === 'JOBS' ? 'sa-btn-primary' : 'sa-btn-secondary'}`}
          >
            <FileText size={16} />
            Conversion Queue ({jobs.length})
          </button>
        </div>

        {/* Tools Manager Table */}
        {activeTab === 'TOOLS' && (
          <div className="sa-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#475569' }}>Tool Name</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#475569' }}>Slug</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#475569' }}>Conversion</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#475569' }}>Status</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Toggle Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tools.map(tool => (
                    <tr key={tool.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{tool.name}</td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>/{tool.slug}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span className="sa-badge sa-badge-primary">
                          {tool.sourceFormat} &rarr; {tool.targetFormat}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span className={`sa-badge ${tool.enabled ? 'sa-badge-success' : 'sa-badge-danger'}`}>
                          {tool.enabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleTool(tool.id, tool.enabled)}
                          className={`sa-btn sa-btn-sm ${tool.enabled ? 'sa-btn-secondary' : 'sa-btn-primary'}`}
                        >
                          <Power size={14} />
                          {tool.enabled ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Jobs Queue Table */}
        {activeTab === 'JOBS' && (
          <div className="sa-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#475569' }}>Job ID</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#475569' }}>Format</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#475569' }}>Status</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#475569' }}>Progress</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#475569' }}>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No conversion jobs in history yet.
                      </td>
                    </tr>
                  ) : (
                    jobs.map(job => (
                      <tr key={job.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {job.id.substring(0, 8)}...
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span className="sa-badge sa-badge-primary">
                            {job.sourceFormat} &rarr; {job.targetFormat}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span className={`sa-badge ${
                            job.status === 'COMPLETED' ? 'sa-badge-success' :
                            job.status === 'PROCESSING' ? 'sa-badge-warning' :
                            job.status === 'FAILED' ? 'sa-badge-danger' : 'sa-badge-primary'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{job.progress}%</td>
                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {formatDate(job.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
