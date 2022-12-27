import { useEffect } from 'react';
import { useUserContext } from 'context/UserContext';
import { UserCommunicationChannelsDocument } from 'context/UserContext/operations.generated';
import analytics from 'services/analytics';
import { Routes, useRouterContext } from 'context/RouterContext';
import { useAuthContext } from 'context/AuthContext';
import { useEnvironment } from 'context/EnvironmentContext';
import {
  useDeleteChannelMutation,
  useGetTelegramVerificationLinkMutation,
} from 'components/ConnectApps/operations.generated';
import { MessagingApp } from 'global/types.generated';

const useTelegramActions = () => {
  const { isSubscribeOnlyMode } = useEnvironment();
  const { login, setIsOnboarding } = useAuthContext();
  const { setRoute } = useRouterContext();
  const { setUserCommsChannelsPollInterval, userCommsChannels, userCommsChannelsPollInterval } =
    useUserContext();

  const [getTelegramLink, { loading: telegramLoading, data: telegramUrlData }] =
    useGetTelegramVerificationLinkMutation();

  const [deleteTelegramIntegration, { loading: deleteLoading }] = useDeleteChannelMutation({
    refetchQueries: [UserCommunicationChannelsDocument],
    variables: {
      input: {
        app: MessagingApp.Telegram,
      },
    },
  });

  const handleRemoveTelegramIntegration = async () => {
    login(async () => {
      const response = await deleteTelegramIntegration();

      if (response?.data?.userCommunicationsChannelDelete?.success) {
        analytics.track('telegram integration removed');
        await getTelegramLink();
        return setRoute(Routes.Settings);
      }
    });
  };

  const handleGenerateUrl = async () => {
    login(async () => {
      await getTelegramLink();
      analytics.track('telegram url generated');
    });
  };

  const handleOpenTG = async () => {
    analytics.track('open telegram clicked');
    setUserCommsChannelsPollInterval(5000);
    window.open(
      telegramUrlData?.telegramVerificationLinkGenerate?.link,
      '_blank',
      'noopener,noreferrer'
    );
  };

  useEffect(() => {
    if (userCommsChannelsPollInterval && userCommsChannels?.telegram?.exists) {
      analytics.track('telegram connected successfully');

      setUserCommsChannelsPollInterval(0);
    }
  }, [setUserCommsChannelsPollInterval, userCommsChannels, userCommsChannelsPollInterval]);

  return {
    telegramLoading,
    deleteLoading,
    telegramVerificationUrl: telegramUrlData?.telegramVerificationLinkGenerate?.link,
    handleGenerateUrl,
    handleOpenTG,
    handleRemoveTelegramIntegration,
    isConnected: userCommsChannels?.telegram?.exists,
    hint: userCommsChannels?.telegram?.hint || '',
  };
};

export default useTelegramActions;