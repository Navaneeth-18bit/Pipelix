import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import DataTable, { type Column } from '@/components/DataTable';
import Drawer from '@/components/Drawer';
import StatusBadge from '@/components/StatusBadge';
import { transactions, formatINR, type Transaction } from '@/data/sampleData';

const paymentMethods = ['All', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer'];
const locations = ['All', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune', 'Hyderabad', 'Kolkata'];

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const filteredData = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        !search ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.customerId.toLowerCase().includes(search.toLowerCase()) ||
        t.productId.toLowerCase().includes(search.toLowerCase());
      const matchesPayment = paymentFilter === 'All' || t.paymentMethod === paymentFilter;
      const matchesLocation = locationFilter === 'All' || t.location === locationFilter;
      return matchesSearch && matchesPayment && matchesLocation;
    });
  }, [search, paymentFilter, locationFilter]);

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
        { label: 'Customer', value: selectedTxn.customerId },
        { label: 'Product', value: selectedTxn.productId },
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
        <div className="flex flex-col lg:flex-row gap-3">
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
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-ink-100">Transaction Records</h3>
            <p className="text-xs text-ink-400 mt-0.5">
              {filteredData.length} of {transactions.length} transactions
            </p>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={filteredData}
          pageSize={8}
          onRowClick={(row) => setSelectedTxn(row)}
          emptyMessage="No transactions match your filters"
        />
      </div>

      {/* Detail Drawer */}
      <Drawer
        open={!!selectedTxn}
        onClose={() => setSelectedTxn(null)}
        title="Transaction Details"
      >
        {selectedTxn && (
          <div className="space-y-5">
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
                <span className={`font-mono text-sm font-semibold ${
                  selectedTxn.anomalyScore !== null ? 'text-ml-400' : 'text-ink-500'
                }`}>
                  {selectedTxn.anomalyScore !== null ? selectedTxn.anomalyScore : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
