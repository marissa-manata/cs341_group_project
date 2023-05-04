import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import { ChakraProvider, extendTheme, ThemeConfig } from '@chakra-ui/react';

// the React root, created from our root element
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// our chakra UI theme config
const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  } as ThemeConfig,
});

// render the app component! the magic is here...
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ChakraProvider theme={theme}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ChakraProvider>
    </Provider>
  </React.StrictMode>
);
