import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

root.render(<App />);
// can't activate strict mode due to this weird issue https://github.com/react-keycloak/react-keycloak/issues/182
