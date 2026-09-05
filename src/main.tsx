import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ThemeProvider } from './app/ThemeProvider';
import { ParamsProvider } from './app/ParamsProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ParamsProvider>
        <App />
      </ParamsProvider>
    </ThemeProvider>
  </StrictMode>
);
