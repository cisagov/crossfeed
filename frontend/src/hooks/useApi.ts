import { useState, useCallback } from 'react';
import { API } from 'aws-amplify';

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

  const apiMethod = useCallback(
    (method: ApiMethod) => async <T extends object = any>(
      path: string,
      init: any = {}
    ) => {
      try {
        setRequestCount(cnt => cnt + 1);
        const options = await prepareInit(init);
        const result = await method('crossfeed', path, options);
        setRequestCount(cnt => cnt - 1);
        return result as T;
      } catch (e) {
        setRequestCount(cnt => cnt - 1);
        onError && onError(e);
        throw e;
      }
    },
    [prepareInit, onError]
  );

  const api = {
    apiGet: useCallback(apiMethod(API.get.bind(API)), [apiMethod]),
    apiPost: useCallback(apiMethod(API.post.bind(API)), [apiMethod]),
    apiDelete: useCallback(apiMethod(API.del.bind(API)), [apiMethod]),
    apiPut: useCallback(apiMethod(API.put.bind(API)), [apiMethod]),
    apiPatch: useCallback(apiMethod(API.patch.bind(API)), [apiMethod])
  };

  return {
    ...api,
    loading: requestCount > 0
  };
};
