'use client';

import { AdminSimpleSettingsPage } from '@/components/admin-simple-settings-page';
import { useAdminOrigins } from '@/components/admin-settings-storage';

export function AdminOriginsPage() {
  const [items, setItems] = useAdminOrigins();

  return <AdminSimpleSettingsPage type="origins" items={items} setItems={setItems} />;
}
