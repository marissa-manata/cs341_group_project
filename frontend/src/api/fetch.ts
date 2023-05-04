import store from 'src/store';
import { selectAuthCredentials } from './auth';

/// a wrapper over `fetch` that adds authentication headers
const fetchClient = (url: string, options?: RequestInit) => {
  const credentials = selectAuthCredentials(store.getState());
  if (credentials)
    options = {
      ...(options ?? {}),
      headers: {
        ...(options?.headers ?? {}),
        Authorization: `Basic ${credentials}`,
      },
    };

  return fetch(url, options);
};

export default fetchClient;
