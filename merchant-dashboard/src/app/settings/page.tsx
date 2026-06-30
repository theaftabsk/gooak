'use client';
import { SettingsPage } from '@/pages/SettingsPage';
import { useDashboardData } from '@/context/DashboardData';
export default function Page() {
  const { shopInfo, saveSettings, savingSettings } = useDashboardData();
  return <SettingsPage shopInfo={shopInfo} onSaveSettings={saveSettings} saving={savingSettings} />;
}
