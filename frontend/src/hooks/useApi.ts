import { useState, useCallback, useEffect } from 'react';
import { API } from 'aws-amplify';

const baseHeaders: HeadersInit = {
  'Content-Type': 'application/json',
  Accept: 'application/json'
};

type ApiMethod = (apiName: string, path: string, init?: any) => Promise<any>;
type OnError = (e: Error) => Promise<void>;

export const useApi = (onError?: OnError) => {
  const [requestCount, setRequestCount] = useState(0);

  const prepareInit = useCallback(async (init: any) => {
    const { headers, ...rest } = init;
    return {
      ...rest,
      headers: {
        ...headers,
        ...baseHeaders,
        Authorization: localStorage.getItem('token')
      }
    };
  }, []);

  const apiMethod = useCallback(
    (method: ApiMethod) => async <T extends object>(
      path: string,
      init: any = {}
    ) => {
      console.log('REQUEST', path);
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

  const get = useCallback(apiMethod(API.get.bind(API)), [apiMethod]);
  const post = useCallback(apiMethod(API.post.bind(API)), [apiMethod]);
  const del = useCallback(apiMethod(API.del.bind(API)), [apiMethod]);
  const put = useCallback(apiMethod(API.put.bind(API)), [apiMethod]);
  const patch = useCallback(apiMethod(API.patch.bind(API)), [apiMethod]);

  useEffect(() => {
    console.log('GET CHANGED');
  }, [get]);

  return {
    get,
    post,
    del,
    put,
    patch,
    loading: requestCount > 0
  };
};
