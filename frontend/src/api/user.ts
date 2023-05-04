import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from 'src/store';

/**
 * A user.
 */
export type User = {
  active: boolean;
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  admin: boolean;
  donator: boolean;
  volunteer: boolean;
  balance: number;
};

/**
 * The type of the user slice in redux.
 */
type UserState = {
  data?: User;
  loading: boolean;
  loggedIn: boolean;
};

/**
 * The user slice in redux. Manages the current user.
 */
const slice = createSlice({
  name: 'user',
  initialState: {
    loading: true,
    loggedIn: false,
    error: undefined,
  } as UserState,
  reducers: {
    /**
     * Set the user data.
     */
    setData: (state, action: PayloadAction<User | undefined>) => {
      state.data = action.payload;
      state.loading = false;
      state.loggedIn = !!action.payload;
    },
    /**
     * Set the state as logging in.
     */
    loggingIn: (state) => {
      state.loading = true;
      state.loggedIn = false;
    },
    /**
     * Set a user flag.
     */
    setFlag: (
      state,
      action: PayloadAction<{ key: keyof User; value: boolean }>
    ) => {
      if (state.data)
        state.data[action.payload.key] = action.payload.value as never; // oh my god what is this
    },
    /**
     * Set the user's balance.
     */
    setBalance: (state, action: PayloadAction<number>) => {
      if (state.data) state.data.balance = action.payload;
    },
  },
});

/**
 * Select the user's state from redux.
 */
export const selectUserState = (state: RootState) => state.user;

/** Select the user from redux. */
export const selectUser = createSelector(
  selectUserState,
  (state) => state.data
);

/** Select the user's ID from redux. */
export const selectUserId = createSelector(selectUser, (user) => user?.id);

/** Select whether or not the current user is loading in redux. */
export const selectUserLoading = createSelector(
  selectUserState,
  (state) => state.loading
);

/** Select whether or not the current user is logged in in redux. */
export const selectUserLoggedIn = createSelector(selectUserState, (state) =>
  state.loading ? null : state.loggedIn
);

/** Select whether or not the user is an admin in redux. */
export const selectUserIsAdmin = createSelector(
  selectUser,
  (user) => user?.admin
);

/** Select whether or not the user is a volunteer in redux. */
export const selectUserIsVolunteer = createSelector(
  selectUser,
  (user) => user?.volunteer
);

/** Select whether or not the user is a donator in redux. */
export const selectUserIsDonator = createSelector(
  selectUser,
  (user) => user?.donator
);

/** Select the user's balance in redux. */
export const selectUserBalance = createSelector(
  selectUser,
  (user) => user?.balance
);

/** Select the user's balance in redux, formatted. */
export const selectUserBalanceText = createSelector(
  selectUserBalance,
  (balance) => (balance != null ? '$' + (balance / 100).toFixed(2) : '')
);

export const {
  setData: setUserData,
  loggingIn: userLoggingIn,
  setFlag: setUserFlag,
  setBalance: setUserBalance,
} = slice.actions;

export default slice;
