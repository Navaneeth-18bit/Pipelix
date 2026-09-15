import { useState, useEffect, useCallback } from 'react';
import { FileUp, Search } from 'lucide-react';
import DataTable, { type Column } from '@/components/DataTable';
import Drawer from '@/components/Drawer';
import StatusBadge from '@/components/StatusBadge';
import LoadingState from '@/components/LoadingState';
import ErrorBanner from '@/components/ErrorBanner';
import {
  fetchTransactions,
  fetchTransactionDetails,
  importTransactions,
  type TransactionDetails,
} from '@/api/transactions';
import { formatINR, type Transaction } from '@/data/sampleData';

const paymentMethods = ['All', 'Credit Card', 'Debit Card', 'UPI', 'PayPal', 'Bank Transfer'];
const locations = ['All', 'Web Store', 'Mobile App', 'Enterprise Portal', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune', 'Hyderabad', 'Kolkata'];

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [transactionsData, setTransactionsData] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTxn, setSelectedTxn] = useState<TransactionDetails | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchTransactions({
        search: search.trim() || undefined,
        paymentMethod: paymentFilter !== 'All' ? paymentFilter : undefined,
        location: locationFilter !== 'All' ? locationFilter : undefined,
        limit: 100,
      });
      setTransactionsData(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [search, paymentFilter, locationFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTransactions();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadTransactions]);

  const handleRowClick = async (row: Transaction) => {
    try {
      setLoadingDetail(true);
      const detail = await fetchTransactionDetails(row.id);
      setSelectedTxn(detail);
    } catch {
      setSelectedTxn(row as TransactionDetails);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setImporting(true);
      setImportMessage(null);
      const result = await importTransactions(file);
      if (result.status === 'imported') {
        setImportMessage(
          result.processing_status === 'completed'
            ? `${result.imported_rows} transaction rows imported. Pipeline run, quality log, and anomaly detection completed.`
            : `${result.imported_rows} transaction rows imported, but derived processing failed: ${result.processing_error || 'unknown error'}`
        );
        await loadTransactions();
      } else {
        const firstError = result.errors[0]?.message || 'CSV validation failed.';
        setImportMessage(`Import rejected: ${firstError}`);
      }
    } catch (err: unknown) {
      setImportMessage(err instanceof Error ? err.message : 'Transaction import failed.');
    } finally {
      setImporting(false);
    }
  };

  const columns: Column<Transaction>[] = [
    {
      key: 'id',
      header: 'Transaction ID',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-ink-100">{row.id}</span>,
    },
    {
      key: 'customerId',
      header: 'Customer ID',
      render: (row) => <span className="font-mono text-xs text-ink-300">{row.customerId}</span>,
    },
    {
      key: 'productId',
      header: 'Product ID',
      render: (row) => <span className="font-mono text-xs text-ink-300">{row.productId}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (row) => <span className="text-ink-300">{row.date}</span>,
    },
    {
      key: 'quantity',
      header: 'Qty',
      sortable: true,
      align: 'right',
      render: (row) => <span className="text-ink-200">{row.quantity}</span>,
    },
    {
      key: 'unitPrice',
      header: 'Unit Price',
      sortable: true,
      align: 'right',
      render: (row) => <span className="text-ink-200">{formatINR(row.unitPrice)}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      sortable: true,
      align: 'right',
      render: (row) => <span className="font-semibold text-ink-100">{formatINR(row.totalAmount)}</span>,
    },
    {
      key: 'paymentMethod',
      header: 'Payment',
      render: (row) => <span className="text-ink-300">{row.paymentMethod}</span>,
    },
    {
      key: 'location',
      header: 'Location',
      render: (row) => <span className="text-ink-300">{row.location}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const detailRows = selectedTxn
    ? [
        { label: 'Transaction ID', value: selectedTxn.id },
        { label: 'Customer', value: selectedTxn.customerName ? `${selectedTxn.customerName} (${selectedTxn.customerId})` : selectedTxn.customerId },
        { label: 'Customer Email', value: selectedTxn.customerEmail || '--' },
        { label: 'Product', value: selectedTxn.productName ? `${selectedTxn.productName} (${selectedTxn.productId})` : selectedTxn.productId },
        { label: 'Category', value: selectedTxn.productCategory || '--' },
        { label: 'Transaction Date', value: selectedTxn.date },
        { label: 'Quantity', value: String(selectedTxn.quantity) },
        { label: 'Unit Price', value: formatINR(selectedTxn.unitPrice) },
        { label: 'Total Amount', value: formatINR(selectedTxn.totalAmount) },
        { label: 'Payment Method', value: selectedTxn.paymentMethod },
        { label: 'Location', value: selectedTxn.location },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card p-4 animate-slide-up">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search by transaction ID, customer, or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-9"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="input min-w-[140px]"
            >
              {paymentMethods.map((m) => (
                <option key={m} value={m} className="bg-ink-800">
                  {m === 'All' ? 'All Payments' : m}
                </option>
              ))}
            </select>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="input min-w-[140px]"
            >
              {locations.map((l) => (
                <option key={l} value={l} className="bg-ink-800">
                  {l === 'All' ? 'All Locations' : l}
                </option>
              ))}
            </select>
            <label className="btn-primary cursor-pointer inline-flex items-center gap-2 whitespace-nowrap">
              <FileUp size={16} />
              {importing ? 'Importing...' : 'Import CSV'}
              <input type="file" accept=".csv,text/csv" onChange={handleImport} disabled={importing} className="sr-only" />
            </label>
          </div>
        </div>
        {importMessage && <p className="text-xs text-ink-300 mt-3">{importMessage}</p>}
      </div>

      {error && <ErrorBanner message={error} onRetry={loadTransactions} />}

      {/* Table */}
      <div className="card p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-ink-100">Transaction Records</h3>
            <p className="text-xs text-ink-400 mt-0.5">
              {transactionsData.length} records retrieved from PostgreSQL ({total} total)
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading transactions from PostgreSQL..." />
        ) : (
          <DataTable
            columns={columns}
            data={transactionsData}
            pageSize={8}
            onRowClick={handleRowClick}
            emptyMessage="No transactions match your filters"
          />
        )}
      </div>

      {/* Detail Drawer */}
      <Drawer
        open={!!selectedTxn}
        onClose={() => setSelectedTxn(null)}
        title="Transaction Details"
      >
        {selectedTxn && (
          <div className="space-y-5">
            {loadingDetail && (
              <p className="text-xs text-ink-400">Loading extended details...</p>
            )}
            <div className="space-y-2.5">
              {detailRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-ink-400">{row.label}</span>
                  <span className="font-medium text-ink-100 font-mono text-xs">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-ink-700 pt-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                Anomaly Analysis
              </h4>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-400">Anomaly Status</span>
                <StatusBadge status={selectedTxn.status} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-400">Anomaly Score</span>
                <span
                  className={`font-mono text-sm font-semibold ${
                    selectedTxn.anomalyScore !== null ? 'text-ml-400' : 'text-ink-500'
                  }`}
                >
                  {selectedTxn.anomalyScore !== null ? selectedTxn.anomalyScore : 'N/A'}
                </span>
              </div>
              {selectedTxn.anomalyDetails && (
                <div className="rounded-lg bg-ink-800/80 p-3 border border-ink-700 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-ink-400">Model:</span>
                    <span className="text-ink-200 font-mono">{selectedTxn.anomalyDetails.model_name} ({selectedTxn.anomalyDetails.model_version})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-400">Detected:</span>
                    <span className="text-ink-200">{selectedTxn.anomalyDetails.detected_at}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
