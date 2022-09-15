import React from 'react';
import NotificationBell from './components/NotificationBell';
import NotificationFeedProvider, {
  NotificationFeedProviderProps,
} from './components/NotificationFeedProvider';
import { CustomTheme } from './theme';
import { Notification } from './context/NotificationsContext/types';
import NotificationFeed from 'components/NotificationFeed';

export {
  NotificationFeed,
  NotificationFeedProvider,
  NotificationBell,
  CustomTheme,
  NotificationFeedProviderProps,
  Notification,
};
