import React from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import * as Notifications from 'expo-notifications';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { migrate } from '../database/migrations';
import { C } from '../constants/theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
});

const icon = (name: string) => ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name={name as any} size={size} color={color} />;

export default function Layout() {
  return (
    <SQLiteProvider databaseName="levelup.db" onInit={migrate}>
      <StatusBar style="light" />
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: C.surface, borderTopColor: C.border }, tabBarActiveTintColor: C.gold, tabBarInactiveTintColor: C.muted }}>
        <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon('sword') }} />
        <Tabs.Screen name="journal" options={{ title: 'Journal', tabBarIcon: icon('notebook-edit') }} />
        <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: icon('chart-line') }} />
        <Tabs.Screen name="achievements" options={{ title: 'Honours', tabBarIcon: icon('trophy') }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('cog') }} />
        <Tabs.Screen name="review" options={{ href: null }} />
        <Tabs.Screen name="mission/[id]" options={{ href: null }} />
      </Tabs>
    </SQLiteProvider>
  );
}
