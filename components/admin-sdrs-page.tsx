'use client';

import { AdminSimpleSettingsPage } from '@/components/admin-simple-settings-page';
import { useAdminSdrs } from '@/components/admin-settings-storage';

export function AdminSdrsPage() {
  const { items, isLoading, error, createItem, updateItem, deleteItem } = useAdminSdrs();

  return (
    <AdminSimpleSettingsPage
      type="sdrs"
      items={items}
      isLoading={isLoading}
      error={error}
      createItem={createItem}
      updateItem={updateItem}
      deleteItem={deleteItem}
    />
  );
}
