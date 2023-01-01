import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useAccount } from 'wagmi';
import Spinner from '../../components/Spinner';
import PageTitle from '../../components/PageTitle';
import { Routes, useRouterContext } from 'context/RouterContext';
import { useChannelContext } from 'context/ChannelContext';
import { Screen } from 'components/layout/Screen';
import Flex from 'components/layout/Flex';
import Text from 'components/Text';
import ConnectWalletButtons from 'screens/connectWallet/components/ConnectWalletButtons';
import { useAuthContext } from 'context/AuthContext';

const Container = styled(Flex)(({ theme }) => ({
  flexDirection: 'column',
  [`@media (max-width: ${theme.w.breakpoints.mobile}px)`]: {
    gap: 24,
  },
}));

export const ConnectWallet = () => {
  const { isConnected, isConnecting } = useAccount();

  const { walletDisconnected, isLoading: authLoading } = useAuthContext();
  const { setRoute } = useRouterContext();
  const { loading: channelLoading, isWrongNetwork } = useChannelContext();

  useEffect(() => {
    if (isConnected) {
      setRoute(Routes.Subscribe);
    }
  }, [isConnected]);

  const loading = isConnecting || channelLoading || authLoading;

  if (loading) {
    return (
      <Screen>
        <Flex alignItems={'center'} height={300}>
          <Spinner size={30} />
        </Flex>
      </Screen>
    );
  }

  return (
    <Screen mb={1}>
      <Container>
        <Flex alignItems={'center'} direction={'column'} gap={1}>
          <PageTitle mb={5} align={'center'}>
            Connect wallet to continue
          </PageTitle>
        </Flex>
        <Flex direction={'column'} width={'100%'} gap={1}>
          <Flex
            width={'100%'}
            mb={2}
            alignItems={'center'}
            justifyContent={'center'}
            direction={'column'}
            gap={2}
          >
            <ConnectWalletButtons />
          </Flex>
          {!isWrongNetwork && walletDisconnected && (
            <Text size={'sm'} mt={1} mb={2} color={'secondary'} opacity={0.8} align={'center'}>
              You will need to sign a message to prove ownership of your wallet.
            </Text>
          )}
        </Flex>
      </Container>
    </Screen>
  );
};