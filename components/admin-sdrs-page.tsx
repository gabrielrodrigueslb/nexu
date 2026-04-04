'use client';

import { AdminSimpleSettingsPage } from '@/components/admin-simple-settings-page';
import { useAdminSdrs } from '@/components/admin-settings-storage';

export function AdminSdrsPage() {
  const [items, setItems] = useAdminSdrs();

  return <AdminSimpleSettingsPage type="sdrs" items={items} setItems={setItems} />;
}
