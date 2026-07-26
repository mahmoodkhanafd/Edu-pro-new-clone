'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { uploadCloudBackup } from '@/utils/cloudBackup';
import { isCapacitorAndroid, saveBackupToDocuments } from '@/utils/deviceStorage';

const CLOUD_SYNC_DELAY_MS = 2000;
const DOCUMENTS_BACKUP_DELAY_MS = 2500;

function getStableDataKey(dataJson: string) {
  try {
    const data = JSON.parse(dataJson) as { exportDate?: string };
    delete data.exportDate;
    return JSON.stringify(data);
  } catch {
    return dataJson;
  }
}

export default function CloudSync() {
  const cloudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const documentsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncingCloud = useRef(false);
  const savingDocuments = useRef(false);
  const lastCloudPayload = useRef('');
  const lastDocumentsPayload = useRef('');

  useEffect(() => {
    let disposed = false;

    const runCloudSync = async () => {
      if (disposed || syncingCloud.current) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      const state = useStore.getState();
      const user = state.currentUser;
      if (user?.provider !== 'google') return;

      const dataJson = state.exportData();
      const stableKey = getStableDataKey(dataJson);
      if (stableKey === lastCloudPayload.current) return;

      syncingCloud.current = true;
      try {
        await uploadCloudBackup({ user, dataJson });
        lastCloudPayload.current = stableKey;
      } catch (error) {
        // Keep local data safe. The next data change or online event will retry.
        console.warn('EduPro cloud sync will retry later:', error);
      } finally {
        syncingCloud.current = false;
      }
    };

    const runDocumentsBackup = async () => {
      if (disposed || savingDocuments.current) return;
      if (!(await isCapacitorAndroid())) return;

      const dataJson = useStore.getState().exportData();
      const stableKey = getStableDataKey(dataJson);
      if (stableKey === lastDocumentsPayload.current) return;

      savingDocuments.current = true;
      try {
        await saveBackupToDocuments(dataJson, { timestamped: false });
        lastDocumentsPayload.current = stableKey;
      } catch (error) {
        console.warn('EduPro Android Documents backup will retry later:', error);
      } finally {
        savingDocuments.current = false;
      }
    };

    const scheduleCloudSync = () => {
      if (cloudTimer.current) clearTimeout(cloudTimer.current);
      cloudTimer.current = setTimeout(runCloudSync, CLOUD_SYNC_DELAY_MS);
    };

    const scheduleDocumentsBackup = () => {
      if (documentsTimer.current) clearTimeout(documentsTimer.current);
      documentsTimer.current = setTimeout(runDocumentsBackup, DOCUMENTS_BACKUP_DELAY_MS);
    };

    const unsubscribe = useStore.subscribe(() => {
      scheduleCloudSync();
      scheduleDocumentsBackup();
    });

    const handleOnline = () => {
      scheduleCloudSync();
      scheduleDocumentsBackup();
    };

    window.addEventListener('online', handleOnline);
    scheduleCloudSync();
    scheduleDocumentsBackup();

    return () => {
      disposed = true;
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      if (cloudTimer.current) clearTimeout(cloudTimer.current);
      if (documentsTimer.current) clearTimeout(documentsTimer.current);
    };
  }, []);

  return null;
}
