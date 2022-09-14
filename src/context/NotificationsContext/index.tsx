import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useEnvironment } from '../EnvironmentContext';
import { useChannelContext } from '../ChannelContext';
import { NotificationsContext, Notification } from './types';
import { useUserCommunicationChannelsLazyQuery } from './operations.generated';
import fetchNotifications from './fetchNotifications';

const NotificationsContext = createContext<NotificationsContext>({
  isLoggedIn: false,
  isLoading: false,
  notifications: [],
} as NotificationsContext);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { isConnected: isLoggedIn, address: userAddress } = useAccount();
  const { chainId, epnsEnv } = useEnvironment();
  const { channelAddress } = useChannelContext();

  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [getCommsChannels, { data }] = useUserCommunicationChannelsLazyQuery();

  useEffect(() => {
    if (!userAddress) return;

    getCommsChannels({ variables: { address: userAddress } });
  }, [userAddress]);

  useEffect(() => {
    const timeout = setInterval(async () => {
      const notifs = await fetchNotifications(`eip155:${chainId}:${userAddress}`, epnsEnv);
      setNotifications(notifs || []);
    }, 4000);

    return () => clearInterval(timeout);
  }, []);

  useEffect(() => {
    if (!userAddress || !channelAddress) return;

    const run = async () => {
      setIsLoading(true);
      const notifs = await fetchNotifications(`eip155:${chainId}:${userAddress}`, epnsEnv);
      setNotifications(notifs || []);
      setIsLoading(false);
    };

    run();
  }, [channelAddress, chainId, epnsEnv, userAddress]);

  return (
    <NotificationsContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        userCommsChannels: data?.userCommunicationChannels,
        notifications,
        userAddress,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export function useNotificationsContext() {
  return useContext(NotificationsContext);
}
