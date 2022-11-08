import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  ElementType,
  useEffect,
} from 'react';
import { useAccount, useDisconnect, useSigner } from 'wagmi';
import * as epns from '@epnsproject/sdk-restapi';
import analytics from '../services/analytics';
import { useEnvironment } from './EnvironmentContext';
import { EmailVerified, Feed, Settings, Subscribe, EmailVerify, WalletDisconnected } from 'screens';
import { useChannelContext } from 'context/ChannelContext';
import { LOCALSTORAGE_AUTH_KEY, LOCALSTORAGE_AUTH_REFRESH_KEY } from 'global/const';
import { useAuthenticate } from 'hooks/auth/useAuthenticate';
import { Auth } from 'screens/auth';

enum Routes {
  Subscribe = 'Subscribe',
  Settings = 'Settings',
  ConnectEmail = 'ConnectEmail',
  NotificationsFeed = 'NotificationsFeed',
  EmailVerify = 'EmailVerify',
  EmailVerified = 'EmailVerified',
  WalletDisconnected = 'WalletDisconnected',
  Auth = 'Auth',
}

type RouterProps = {
  [key: string]: string;
};

type RouterContext = {
  activeRoute: Routes;
  subscribe(): void;
  unsubscribe(): void;
  setRoute(route: Routes, props?: RouterProps): void;
  Component: ElementType;
  props?: RouterProps;
  isLoading: boolean;
  error: boolean;
  isLoggedIn: boolean;
  login(callback?: () => void): void;
};

const RouterContext = createContext<RouterContext>({
  activeRoute: Routes.Subscribe,
} as RouterContext);

const isUserSubscribed = async (args: {
  userAddress: string;
  channelAddress: string;
  chainId: number;
}): Promise<boolean> => {
  const { userAddress, channelAddress, chainId } = args;
  const subbedChannels: { channel: string }[] = await epns.user.getSubscriptions({
    user: `eip155:${chainId}:${userAddress}`,
    env: chainId === 1 ? undefined : 'staging',
  });
  const subbedChannelsLower = subbedChannels.map((s) => s.channel.toLowerCase());
  return subbedChannelsLower.indexOf(channelAddress.toLowerCase()) !== -1;
};

const RouterProvider = ({ children }: { children: ReactNode }) => {
  const { channelAddress, chainId } = useChannelContext();
  const { isConnected, address } = useAccount();
  const { data: signer } = useSigner();
  const { login: _login } = useAuthenticate();
  const dc = useDisconnect();

  const [active, setActive] = useState(Routes.Subscribe);
  const [routerProps, setRouterProps] = useState<RouterProps>({});
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [error, setError] = useState(false);
  const [loginCallback, setLoginCallback] = useState<() => void>();

  const setRouteWithParams = (route: Routes, props?: RouterProps) => {
    analytics.track(`${route} page loaded`);
    setActive(route);
    if (props) setRouterProps(props);
  };

  useEffect(() => {
    if (!isConnected || !channelAddress) {
      return;
    }

    (async () => {
      setIsLoading(true);
      setIsSubscribed(
        await isUserSubscribed({
          userAddress: address as string,
          channelAddress,
          chainId,
        })
      );
      setIsLoading(false);
    })();
  }, [channelAddress, address, isConnected]);

  useEffect(() => {
    if (!isConnected) {
      logout();
      setRouteWithParams(Routes.WalletDisconnected);
      return;
    }

    if (!isSubscribed) {
      setRouteWithParams(Routes.Subscribe);
      return;
    }

    if (!isLoggedIn && localStorage.getItem(LOCALSTORAGE_AUTH_KEY)) {
      setIsLoggedIn(true);
    }

    if (loginCallback) {
      loginCallback();
      setLoginCallback(undefined);
      return;
    }

    if (isFirstLogin) {
      setRouteWithParams(Routes.ConnectEmail);
      return;
    }

    setRouteWithParams(Routes.NotificationsFeed);
  }, [isConnected, isSubscribed, isFirstLogin, isLoggedIn, loginCallback]);

  const login = async (callback?: () => void) => {
    analytics.track('login');
    setIsLoading(true);
    setError(false);
    setActive(Routes.Auth);

    try {
      const result = await _login(channelAddress);
      localStorage.setItem(LOCALSTORAGE_AUTH_KEY, result.token);
      localStorage.setItem(LOCALSTORAGE_AUTH_REFRESH_KEY, result.refreshToken);
      setIsLoggedIn(true);

      if (callback) {
        setLoginCallback(() => {
          return callback;
        });
      }
    } catch (e) {
      setError(true);
    }

    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem(LOCALSTORAGE_AUTH_KEY);
    localStorage.removeItem(LOCALSTORAGE_AUTH_REFRESH_KEY);
    setIsSubscribed(false);
    setError(false);
    setIsLoading(false);
    dc.disconnect();
  };

  useEffect(() => {
    localStorage.removeItem(LOCALSTORAGE_AUTH_KEY);
    setIsLoggedIn(false);
  }, [address]);

  const toggleSubscription = async (action: 'sub' | 'unsub') => {
    setIsLoading(true);
    const params = {
      signer: signer as any,
      channelAddress: `eip155:${chainId}:${channelAddress}`,
      userAddress: `eip155:${chainId}:${address}`,
      env: chainId === 1 ? undefined : 'staging',
    };

    const response =
      action == 'sub'
        ? await epns.channels.subscribe(params)
        : await epns.channels.unsubscribe(params);

    setIsLoading(false);

    if (response.status == 'success') {
      if (action === 'sub') setIsFirstLogin(true);
      setIsSubscribed(action === 'sub');
    }
  };

  const subscribe = () => toggleSubscription('sub');
  const unsubscribe = () => toggleSubscription('unsub');

  const RouteScreens = {
    [Routes.Subscribe]: Subscribe,
    [Routes.Settings]: Settings,
    [Routes.ConnectEmail]: Settings,
    [Routes.NotificationsFeed]: Feed,
    [Routes.EmailVerify]: EmailVerify,
    [Routes.EmailVerified]: EmailVerified,
    [Routes.WalletDisconnected]: WalletDisconnected,
    [Routes.Auth]: Auth,
  };

  return (
    <RouterContext.Provider
      value={{
        activeRoute: active,
        subscribe,
        unsubscribe,
        setRoute: setRouteWithParams,
        Component: RouteScreens[active],
        props: routerProps,
        isLoading,
        error,
        isLoggedIn,
        login,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

function useRouterContext() {
  return useContext(RouterContext);
}

export { Routes, RouterProvider, useRouterContext };
