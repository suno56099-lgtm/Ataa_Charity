/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { dataService } from './services/dataService.ts';
import { StaffAccount } from './types/index.ts';
import { Header } from './components/Header.tsx';
import { Sidebar, ActiveTab } from './components/Sidebar.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { BeneficiariesView } from './components/BeneficiariesView.tsx';
import { ProductsView } from './components/ProductsView.tsx';
import { DeliveryView } from './components/DeliveryView.tsx';
import { MonthlyCodesView } from './components/MonthlyCodesView.tsx';
import { LogsView } from './components/LogsView.tsx';
import { StaffView } from './components/StaffView.tsx';

// Inactivity session timeout: 15 minutes (900 seconds)
const INACTIVITY_TIMEOUT_SECONDS = 900;

export default function App() {
  const [currentUser, setCurrentUser] = useState<StaffAccount | null>(() =>
    dataService.getCurrentUser()
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Inactivity Timer
  const [inactivitySecondsRemaining, setInactivitySecondsRemaining] = useState(
    INACTIVITY_TIMEOUT_SECONDS
  );

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleLogout = useCallback(() => {
    dataService.logout();
    setCurrentUser(null);
  }, []);

  // Reset inactivity timer on user interaction
  const resetInactivityTimer = useCallback(() => {
    setInactivitySecondsRemaining(INACTIVITY_TIMEOUT_SECONDS);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleActivity = () => {
      resetInactivityTimer();
    };

    events.forEach((evt) => window.addEventListener(evt, handleActivity));

    const interval = setInterval(() => {
      setInactivitySecondsRemaining((prev) => {
        if (prev <= 1) {
          handleLogout();
          return INACTIVITY_TIMEOUT_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      clearInterval(interval);
    };
  }, [currentUser, handleLogout, resetInactivityTimer]);

  // Read current data snapshots
  const metrics = dataService.getDashboardMetrics();
  const recentDeliveries = dataService.getDeliveries();
  const beneficiaries = dataService.getBeneficiaries();
  const products = dataService.getProducts();
  const auditLogs = dataService.getAuditLogs();
  const staffList = dataService.getStaffAccounts();

  // If not logged in, show Login Modal
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0F1412] text-[#E8EDEA] flex flex-col justify-center items-center">
        <LoginModal
          onSuccess={(user) => {
            setCurrentUser(user);
            resetInactivityTimer();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1412] text-[#E8EDEA] flex flex-col font-['Cairo',sans-serif]">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        inactivitySecondsRemaining={inactivitySecondsRemaining}
      />

      {/* Main Body Layout: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Right-Side Desktop Sidebar & Mobile Bottom Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          userRole={currentUser.role}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              recentDeliveries={recentDeliveries}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'beneficiaries' && (
            <BeneficiariesView beneficiaries={beneficiaries} onRefresh={handleRefresh} />
          )}

          {activeTab === 'products' && (
            <ProductsView
              products={products}
              onRefresh={handleRefresh}
              isAdmin={currentUser.role === 'admin'}
            />
          )}

          {activeTab === 'delivery' && (
            <DeliveryView
              products={products}
              currentUser={currentUser}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'codes' && <MonthlyCodesView onRefresh={handleRefresh} />}

          {activeTab === 'logs' && (
            <LogsView deliveries={recentDeliveries} auditLogs={auditLogs} />
          )}

          {activeTab === 'staff' && currentUser.role === 'admin' && (
            <StaffView
              staffList={staffList}
              currentUser={currentUser}
              onRefresh={handleRefresh}
            />
          )}
        </main>
      </div>

      {/* Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
}
