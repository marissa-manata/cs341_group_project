import { combineReducers, configureStore } from '@reduxjs/toolkit';

import auth from './api/auth';
import user from './api/user';

const store = configureStore({
  reducer: combineReducers({
    auth: auth.reducer,
    user: user.reducer,
  }),
});

export type RootState = ReturnType<typeof store.getState>;
export default store;
