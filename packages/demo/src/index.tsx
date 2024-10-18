import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
const router = createBrowserRouter([{ path: '*', element: <App /> }]);

root.render(
    <React.StrictMode>
        {/* Comment to test HashRouter */}
        <RouterProvider router={router} />
        {/* Uncomment to test HashRouter */}
        {/* <App /> */}
    </React.StrictMode>
);
