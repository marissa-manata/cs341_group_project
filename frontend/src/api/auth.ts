import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { socket } from 'src/App';
import { RootState } from '../store';

/// The type of the auth redux slice
type AuthState = {
  credentials?: string;
};

/// redux slice that handles authentication
const slice = createSlice({
  name: 'auth',
  initialState: {
    credentials: localStorage['auth'] ?? sessionStorage['auth'],
  } as AuthState,
  reducers: {
    // store new credentials in redux (and by extension browser storage)
    store: (
      state,
      action: PayloadAction<{
        email: string;
        password: string;
        remember?: boolean;
      }>
    ) => {
      // delete old credentials
      delete localStorage['auth'];
      delete sessionStorage['auth'];

      // set new credentials string in redux
      state.credentials = btoa(
        `${action.payload.email}:${action.payload.password}`
      );

      // update storage
      if (action.payload.remember) localStorage['auth'] = state.credentials;
      else sessionStorage['auth'] = state.credentials;
    },
    // change the password and commit to storage
    changePassword: (state, action: PayloadAction<string>) => {
      if (!state.credentials) return;

      // decode old credentials
      const creds = atob(state.credentials);
      state.credentials = btoa(
        creds.substring(0, creds.indexOf(':')) + ':' + action.payload
      );

      // update credentials in storage
      if ('auth' in localStorage) localStorage['auth'] = state.credentials;
      if ('auth' in sessionStorage) sessionStorage['auth'] = state.credentials;
    },
    // logout
    logout: (state) => {
      // delete all stored credentials
      delete localStorage['auth'];
      delete sessionStorage['auth'];
      delete state['credentials'];

      try {
        socket.emit('logout');
      } catch (_) {
        /* */
      }
    },
  },
});

/// select the authentication object from redux state
export const selectAuth = (state: RootState) => state.auth;

// select authentication credentials from redux state
export const selectAuthCredentials = createSelector(
  selectAuth,
  (state) => state.credentials
);

export const {
  store: storeCredentials,
  logout: logoutCredentials,
  changePassword,
} = slice.actions;

export default slice;
