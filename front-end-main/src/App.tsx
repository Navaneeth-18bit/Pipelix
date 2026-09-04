import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import OverviewPage from '@/pages/OverviewPage';
import QualityPage from '@/pages/QualityPage';
import TransactionsPage from '@/pages/TransactionsPage';
import AnomaliesPage from '@/pages/AnomaliesPage';
import PipelinesPage from '@/pages/PipelinesPage';
import DatabasePage from '@/pages/DatabasePage';
import SystemPage from '@/pages/SystemPage';
import SettingsPage from '@/pages/SettingsPage';
import type { PageKey } from '@/data/sampleData';

const pageMeta: Record<PageKey, { title: string; subtitle: string; showRange: boolean }> = {
  overview: {
    title: 'Overview',
    subtitle: 'Monitor your data pipelines, quality, and anomalies.',
    showRange: true,
  },
  quality: {
    title: 'Data Quality',
    subtitle: 'Track data quality scores and validation checks.',
    showRange: true,
  },
  transactions: {
    title: 'Transactions',
    subtitle: 'Explore and analyze processed transaction records.',
    showRange: false,
  },
  anomalies: {
    title: 'Anomaly Detection',
    subtitle: 'Monitor unusual transaction patterns detected by the ML pipeline.',
    showRange: true,
  },
  pipelines: {
    title: 'Pipeline Monitoring',
    subtitle: 'Track Pipelix data pipeline executions and processing performance.',
    showRange: true,
  },
  database: {
    title: 'Database',
    subtitle: 'PostgreSQL connection and table overview.',
    showRange: false,
  },
  system: {
    title: 'System Health',
    subtitle: 'Monitor the status of all Pipelix services.',
    showRange: false,
  },
  settings: {
    title: 'Settings',
    subtitle: 'Configure Pipelix preferences and notifications.',
    showRange: false,
  },
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const meta = pageMeta[currentPage];

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <OverviewPage />;
      case 'quality':
        return <QualityPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'anomalies':
        return <AnomaliesPage />;
      case 'pipelines':
        return <PipelinesPage />;
      case 'database':
        return <DatabasePage />;
      case 'system':
        return <SystemPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-ink-950">
      <Sidebar
        current={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          setMobileSidebarOpen(false);
        }}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setMobileSidebarOpen(true)}
          showRangeFilter={meta.showRange}
        />

        <main className="flex-1 px-5 py-6 lg:px-8 animate-fade-in">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
