import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider, AuthInit } from './app/modules/auth/core/Auth';
import { setupAxios } from './app/modules/auth/core/setupAxios';
import axios from 'axios';
import './index.css';
import './styles/modal-layout.css';

// Setup axios interceptors
setupAxios(axios);

// Get base path for GitHub Pages deployment
// In production, this will be '/repo-name/', in development it's '/'
const basename = import.meta.env.BASE_URL;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <AuthInit>
          <App />
        </AuthInit>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
