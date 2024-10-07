import * as React from 'react';
import { useLogin } from 'ra-core';

export const LoginPage = () => {
    const login = useLogin();
    React.useEffect(() => {
        login({});
    }, [login]);
    return null;
};
