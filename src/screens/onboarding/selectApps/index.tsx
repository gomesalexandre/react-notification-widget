import React, { useMemo } from 'react';
import styled from 'styled-components';
import analytics from '../../../services/analytics';
import Text from '../../../components/Text';
import Flex from 'components/layout/Flex';
import { Screen } from 'components/layout/Screen';
import { useChannelContext } from 'context/ChannelContext';
import PageTitle from 'components/PageTitle';
import Button from 'components/Button';
import { Routes, useRouterContext } from 'context/RouterContext';
import { useEnvironment } from 'context/EnvironmentContext';
import Preferences from 'components/Preferences';
import { MessagingApp } from 'global/types.generated';
import { useUserContext } from 'context/UserContext';
import { Web2ChannelLower, Web2Channels } from 'context/UserContext/const';

const Header = styled.div`
  text-align: center;
  margin-bottom: 8px;
`;

export const SelectApps = () => {
  const { discordGuildUrl, messageCategories, name } = useChannelContext();
  const { user } = useUserContext();
  const { setRoute } = useRouterContext();
  const { isSubscribeOnlyMode } = useEnvironment();

  const appConfig = Web2Channels.filter((channel) =>
    channel === MessagingApp.Discord ? discordGuildUrl && isSubscribeOnlyMode : true
  ).map((app) => ({ app, enabled: true }));

  const appsToConnect = useMemo(() => {
    return Web2Channels.filter((channel) => {
      const selectedByUser = user?.preferences.some(
        (pref) => pref[channel.toLowerCase() as Web2ChannelLower]
      );

      return channel === MessagingApp.Discord
        ? selectedByUser && discordGuildUrl && isSubscribeOnlyMode
        : selectedByUser;
    });
  }, [discordGuildUrl, user]);

  const onNext = () => {
    const selectedCategories = user?.preferences.filter((pref) => pref.enabled) || [];
    analytics.track('preferences set up', {
      numCategories: messageCategories.length,
      categoriesSelected: selectedCategories.length,
      discordOn: selectedCategories.filter((pref) => pref.discord).length,
      telegramOn: selectedCategories.filter((pref) => pref.telegram).length,
      emailOn: selectedCategories.filter((pref) => pref.email).length,
      categories: messageCategories,
      userPreferences: user?.preferences,
    });

    if (appsToConnect.length) {
      setRoute(Routes.SetupApps, { appsToConnect });
    } else {
      setRoute(isSubscribeOnlyMode ? Routes.SubscriptionFlowEnded : Routes.NotificationsFeed);
    }
  };

  return (
    <Screen mb={1}>
      <Header>
        <PageTitle mb={2}>Where else should we notify you?</PageTitle>
        <Text mb={2} color={'secondary'}>
          {`${name} won't have access to your contact info`}
        </Text>
      </Header>

      <Preferences hideDescriptions appConfig={appConfig} />

      <Flex mb={2} mt={2} gap={1} width={'100%'}>
        <Button
          size={'lg'}
          variant={'gray'}
          width={'100%'}
          onClick={() => setRoute(Routes.SelectCategories)}
        >
          Previous
        </Button>
        <Button size={'lg'} width={'100%'} onClick={onNext}>
          Next
        </Button>
      </Flex>
    </Screen>
  );
};