"use client";

import type { NewsletterManagerProps } from "./types";
import { NewsletterStatsCards } from "./NewsletterStatsCards";
import { NewsletterControls } from "./NewsletterControls";
import { NewsletterSubscribersTable } from "./NewsletterSubscribersTable";
import { NewsletterBroadcastModal } from "./NewsletterBroadcastModal";
import { DeleteSubscriberModal } from "./DeleteSubscriberModal";
import { useNewsletterManager } from "./useNewsletterManager";

export type { NewsletterManagerProps };

export function NewsletterManager({
  initialSubscribers,
  initialStats,
}: NewsletterManagerProps) {
  const {
    stats,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredSubscribers,
    isBroadcastModalOpen,
    setIsBroadcastModalOpen,
    broadcastSubject,
    setBroadcastSubject,
    broadcastMessage,
    setBroadcastMessage,
    broadcastImageUrl,
    setBroadcastImageUrl,
    deleteConfirmId,
    setDeleteConfirmId,
    portalTarget,
    isPending,
    handleExportCsv,
    handleToggleStatus,
    handleDelete,
    closeBroadcastModal,
    handleSendBroadcast,
  } = useNewsletterManager({ initialSubscribers, initialStats });

  return (
    <div className="space-y-6">
      <NewsletterStatsCards stats={stats} />

      <NewsletterControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        stats={stats}
        isPending={isPending}
        onExportCsv={handleExportCsv}
        onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
      />

      <NewsletterSubscribersTable
        subscribers={filteredSubscribers}
        searchTerm={searchTerm}
        isPending={isPending}
        onToggleStatus={handleToggleStatus}
        onConfirmDelete={(id: string) => setDeleteConfirmId(id)}
      />

      <NewsletterBroadcastModal
        isOpen={isBroadcastModalOpen}
        portalTarget={portalTarget}
        stats={stats}
        isPending={isPending}
        broadcastSubject={broadcastSubject}
        setBroadcastSubject={setBroadcastSubject}
        broadcastMessage={broadcastMessage}
        setBroadcastMessage={setBroadcastMessage}
        broadcastImageUrl={broadcastImageUrl}
        setBroadcastImageUrl={setBroadcastImageUrl}
        onClose={closeBroadcastModal}
        onSubmit={handleSendBroadcast}
      />

      <DeleteSubscriberModal
        portalTarget={portalTarget}
        deleteConfirmId={deleteConfirmId}
        isPending={isPending}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
