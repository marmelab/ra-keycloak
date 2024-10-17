import * as React from 'react';

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Layout } from 'react-admin';
import { CssBaseline } from '@mui/material';

export default props => (
    <>
        <CssBaseline />
        <Layout {...props} />
        <ReactQueryDevtools initialIsOpen={false} />
    </>
);
