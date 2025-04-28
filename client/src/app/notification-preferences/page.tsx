import React from 'react';
import { Metadata } from 'next';
import NotificationPreferences from '@/components/notification-preferences';
import { PageHeader } from '@/components/page-header';
import { Bell } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Préférences de notification | MyFamily',
  description: 'Gérez vos préférences de notification pour MyFamily',
};

export default function NotificationPreferencesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        heading="Préférences de notification"
        description="Personnalisez les notifications que vous souhaitez recevoir"
        icon={<Bell className="h-6 w-6" />}
      />
      <NotificationPreferences />
    </div>
  );
}
