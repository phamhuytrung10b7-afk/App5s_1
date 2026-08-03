import React, { useState, useEffect, useCallback } from 'react';
import { Part, Transaction, AppSettings, ViewTab } from './types';
import { storageService } from './storage';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ElectronicBinCardModal } from './ElectronicBinCardModal';
import { PartModal } from './PartModal';
import { ConfirmModal } from './ConfirmModal';

import { DashboardView } from './DashboardView';
import { PartsListView } from './PartsListView';
import { StockInView } from './StockInView';
import { StockOutView } from './StockOutView';
import { BinCardHistoryView } from './BinCardHistoryView';
import { ReportsView } from './ReportsView';
import { SettingsView } from './SettingsView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [parts, setParts] = useState<Part[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());
  const [searchTerm, setSearchTerm] = useState('');

  // Bin Card Modal State
  const [selectedBinCardPart, setSelectedBinCardPart] = useState<Part | null>(null);
  const [isBinCardOpen, setIsBinCardOpen] = useState(false);

  // Part Add/Edit Modal State
  const [partToEdit, setPartToEdit] = useState<Part | null>(null);
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);

  // Delete Confirm Modal State
  const [partToDelete, setPartToDelete] = useState<Part | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Refresh data from storage
  const refreshData = useCallback(() => {
    setParts(storageService.getParts());
    setTransactions(storageService.getTransactions());
    setSettings(storageService.getSettings());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Open Electronic Bin Card for a part
  const handleOpenBinCard = (part: Part) => {
    // Refresh part object from storage to get latest stock
    const latestPart = storageService.getPartById(part.id) || part;
    setSelectedBinCardPart(latestPart);
    setIsBinCardOpen(true);
  };

  // Handle Save Part (Add or Edit)
  const handleSavePart = (
    partData: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>,
    editId?: string
  ) => {
    if (editId) {
      storageService.updatePart(editId, partData);
    } else {
      storageService.addPart(partData);
    }
    refreshData();
  };

  // Handle Delete Part
  const handleConfirmDelete = () => {
    if (partToDelete) {
      storageService.deletePart(partToDelete.id);
      setIsDeleteModalOpen(false);
      setPartToDelete(null);
      refreshData();
    }
  };

  // Low & Out stock counts for badge
  const lowStockCount = parts.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock).length;
  const outOfStockCount = parts.filter((p) => p.currentStock === 0).length;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 antialiased overflow-hidden">
      {/* Left Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        lowStockCount={lowStockCount}
        outOfStockCount={outOfStockCount}
      />

      {/* Main Right Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Sticky Header */}
        <Header
          settings={settings}
          onNavigateTab={setCurrentTab}
          onOpenQuickAdd={() => {
            setPartToEdit(null);
            setIsPartModalOpen(true);
          }}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {/* View Router Body */}
        <main className="flex-1 pb-12">
          {currentTab === 'dashboard' && (
            <DashboardView
              parts={parts}
              transactions={transactions}
              onNavigateTab={setCurrentTab}
              onOpenBinCard={handleOpenBinCard}
            />
          )}

          {currentTab === 'parts' && (
            <PartsListView
              parts={parts}
              settings={settings}
              onOpenAddModal={() => {
                setPartToEdit(null);
                setIsPartModalOpen(true);
              }}
              onOpenEditModal={(part) => {
                setPartToEdit(part);
                setIsPartModalOpen(true);
              }}
              onOpenDeleteModal={(part) => {
                setPartToDelete(part);
                setIsDeleteModalOpen(true);
              }}
              onOpenBinCard={handleOpenBinCard}
              onRefreshParts={refreshData}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          )}

          {currentTab === 'stock_in' && (
            <StockInView parts={parts} settings={settings} onSuccess={refreshData} />
          )}

          {currentTab === 'stock_out' && (
            <StockOutView parts={parts} settings={settings} onSuccess={refreshData} />
          )}


          {currentTab === 'bin_card' && (
            <BinCardHistoryView
              parts={parts}
              transactions={transactions}
              onOpenBinCard={handleOpenBinCard}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              parts={parts}
              transactions={transactions}
              onOpenBinCard={handleOpenBinCard}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={setSettings}
              onRefreshAll={refreshData}
            />
          )}
        </main>
      </div>

      {/* Global Electronic Bin Card Modal (100% Paper Bin Card Replica) */}
      <ElectronicBinCardModal
        part={selectedBinCardPart}
        isOpen={isBinCardOpen}
        onClose={() => setIsBinCardOpen(false)}
        settings={settings}
      />

      {/* Add / Edit Part Modal */}
      <PartModal
        isOpen={isPartModalOpen}
        onClose={() => setIsPartModalOpen(false)}
        onSave={handleSavePart}
        partToEdit={partToEdit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Xác nhận xóa linh kiện"
        message={`Bạn có chắc chắn muốn xóa mã linh kiện [${partToDelete?.code}] "${partToDelete?.name}" khỏi hệ thống kho? Lịch sử thẻ kho của linh kiện này cũng sẽ bị xóa!`}
        confirmLabel="Xóa linh kiện"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
