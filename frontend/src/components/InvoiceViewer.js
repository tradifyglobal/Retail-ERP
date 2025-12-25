import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

/**
 * InvoiceViewer Component
 * Display all invoices with filtering, pagination, and download capability
 */
const InvoiceViewer = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const pageSize = 10;

  useEffect(() => {
    fetchInvoices();
  }, [page, filterStatus, sortBy]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page,
        limit: pageSize,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        sort: sortBy
      });

      const response = await api.get(`/billing/invoices?${params}`);

      setInvoices(response.data.invoices || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoices');
      console.error('Invoice fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (invoiceId) => {
    try {
      const response = await api.get(`/billing/invoices/${invoiceId}/pdf`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Failed to download invoice');
      console.error('PDF download error:', err);
    }
  };

  const handleSendEmail = async (invoiceId) => {
    try {
      const response = await api.post(`/billing/invoices/${invoiceId}/send-email`);
      if (response.data.success) {
        alert('Invoice sent to your email');
      }
    } catch (err) {
      alert('Failed to send invoice');
    }
  };

  return (
    <div className="invoice-viewer">
      <h2>Invoices</h2>

      {error && <div className="error-banner">{error}</div>}

      {/* Filters */}
      <div className="invoice-filters">
        <div className="filter-group">
          <label>Status</label>
          <select value={filterStatus} onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}>
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By</label>
          <select value={sortBy} onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
          }}>
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading invoices...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="empty-state">
          <p>📄 No invoices yet</p>
          <p className="subtext">Your invoices will appear here once you make a purchase</p>
        </div>
      ) : (
        <>
          <div className="invoices-table-wrapper">
            <table className="invoices-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} onClick={() => setSelectedInvoice(invoice)}>
                    <td className="invoice-number">
                      <span className="clickable">#{invoice.number}</span>
                    </td>
                    <td className="invoice-date">
                      {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="invoice-amount">
                      <strong>${invoice.total}</strong>
                    </td>
                    <td className="invoice-description">
                      {invoice.description || 'Subscription'}
                    </td>
                    <td className="invoice-status">
                      <span className={`badge status-${invoice.status}`}>
                        {invoice.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="invoice-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPDF(invoice.id);
                        }}
                        className="action-btn download"
                        title="Download PDF"
                      >
                        📥
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendEmail(invoice.id);
                        }}
                        className="action-btn email"
                        title="Send to Email"
                      >
                        ✉️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary"
            >
              ← Previous
            </button>
            <span className="page-info">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary"
            >
              Next →
            </button>
          </div>
        </>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onDownload={() => handleDownloadPDF(selectedInvoice.id)}
          onSendEmail={() => handleSendEmail(selectedInvoice.id)}
        />
      )}
    </div>
  );
};

/**
 * Invoice Detail Modal
 */
const InvoiceDetailModal = ({ invoice, onClose, onDownload, onSendEmail }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content invoice-modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close">✕</button>

        {/* Invoice Header */}
        <div className="invoice-detail-header">
          <h2>Invoice #{invoice.number}</h2>
          <div className="invoice-meta">
            <span className={`badge status-${invoice.status}`}>
              {invoice.status?.toUpperCase()}
            </span>
            <span className="invoice-date">
              {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="invoice-content">
          {/* Line Items */}
          {invoice.lineItems && invoice.lineItems.length > 0 && (
            <div className="invoice-section">
              <h3>Items</h3>
              <table className="line-items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.description || 'Subscription'}</td>
                      <td>{item.quantity || 1}</td>
                      <td>${item.unitPrice || item.amount}</td>
                      <td><strong>${item.amount}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="invoice-totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>${invoice.subtotal || invoice.total}</span>
            </div>
            {invoice.tax > 0 && (
              <div className="total-row">
                <span>Tax:</span>
                <span>${invoice.tax}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="total-row discount">
                <span>Discount:</span>
                <span>-${invoice.discount}</span>
              </div>
            )}
            <div className="total-row grand-total">
              <span>Total Amount:</span>
              <span>${invoice.total}</span>
            </div>
          </div>

          {/* Payment Info */}
          {invoice.paidAt && (
            <div className="invoice-section">
              <p className="success">
                ✓ Paid on {new Date(invoice.paidAt).toLocaleDateString('en-US')}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="modal-buttons">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button onClick={onSendEmail} className="btn-secondary">
            📧 Send Email
          </button>
          <button onClick={onDownload} className="btn-primary">
            📥 Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewer;
