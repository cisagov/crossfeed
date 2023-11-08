import { useState, useCallback, useMemo } from 'react';
import { API } from 'aws-amplify';
// import { useMatomo } from '@datapunt/matomo-tracker-react';

const baseHeaders: HeadersInit = {
  'Content-Type': 'application/json',
  Accept: 'application/json'
};

type ApiMethod = (apiName: string, path: string, init?: any) => Promise<any>;
type OnError = (e: Error) => Promise<void>;

export const useApi = (onError?: OnError) => {
  const [requestCount, setRequestCount] = useState(0);

  const getToken = () => {
    const t = localStorage.getItem('token');
    try {
      return t ? JSON.parse(t) : '';
    } catch {
      return '';
    }
  };

  const prepareInit = useCallback(async (init: any) => {
    const { headers, ...rest } = init;
    return {
      ...rest,
      headers: {
        ...headers,
        ...baseHeaders,
        Authorization: getToken()
      }
    };
  }, []);

  // const { trackEvent } = useMatomo();

  const apiMethod = useCallback(
    (method: ApiMethod, methodName: string) =>
      async <T extends object = any>(path: string, init: any = {}) => {
        const { showLoading = true, ...rest } = init;
        try {
          // trackEvent({
          //   category: 'apiMethod',
          //   action: methodName,
          //   name: path,
          //   documentTitle: document.title
          // });
          showLoading && setRequestCount((cnt) => cnt + 1);
          const options = await prepareInit(rest);
          const result = await method('crossfeed', path, options);
          showLoading && setRequestCount((cnt) => cnt - 1);
          return result as T;
        } catch (e: any) {
          showLoading && setRequestCount((cnt) => cnt - 1);
          onError && onError(e);
          throw e;
        }
      },
    // Adding trackEvent to deps causes an infinite loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prepareInit, onError]
  );

  const api = {
    apiGet: useMemo(() => apiMethod(API.get.bind(API), 'get'), [apiMethod]),
    apiPost: useMemo(() => apiMethod(API.post.bind(API), 'post'), [apiMethod]),
    apiDelete: useMemo(() => apiMethod(API.del.bind(API), 'del'), [apiMethod]),
    apiPut: useMemo(() => apiMethod(API.put.bind(API), 'put'), [apiMethod]),
    apiPatch: useMemo(
      () => apiMethod(API.patch.bind(API), 'patch'),
      [apiMethod]
    )
  };

  return {
    ...api,
    loading: requestCount > 0
  };
};
