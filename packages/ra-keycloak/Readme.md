# ra-keycloak

An auth provider for [react-admin](https://github.com/marmelab/react-admin) which handles authentication via a [Keycloak](https://www.keycloak.org/guides) server.

This package provides:

-   A `keycloakAuthProvider` for react-admin
-   A helper `httpClient` which adds headers needed by Keycloak in all requests.

This package uses [keycloak-js](https://www.npmjs.com/package/keycloak-js) to handle the Keycloak authentication.

## Installation

```sh
yarn add ra-keycloak
# or
npm install --save ra-keycloak
```

## Example usage

```jsx
// in src/App.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Admin, Resource, AuthProvider, DataProvider } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';
import Keycloak, {
    KeycloakConfig,
    KeycloakTokenParsed,
    KeycloakInitOptions,
} from 'keycloak-js';
import { useKeycloakAuthProvider, httpClient, LoginPage } from 'ra-keycloak';

import comments from './comments';
import i18nProvider from './i18nProvider';
import Layout from './Layout';
import posts from './posts';
import users from './users';
import tags from './tags';

const config: KeycloakConfig = {
    url: '$KEYCLOAK_URL',
    realm: '$KEYCLOAK_REALM',
    clientId: '$KEYCLOAK_CLIENT_ID',
};

// here you can set options for the keycloak client
const initOptions: KeycloakInitOptions = {
    // Optional: makes Keycloak check that a user session already exists when it initializes
    // and immediately consider the user as authenticated if one exists.
    onLoad: 'check-sso',
};

// here you can implement the permission mapping logic for react-admin
const getPermissions = (decoded: KeycloakTokenParsed) => {
    const roles = decoded?.realm_access?.roles;
    if (!roles) {
        return false;
    }
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('user')) return 'user';
    return false;
};

const App = () => {
    const keycloakClient = new Keycloak(config);
    const authProvider = useKeycloakAuthProvider(keycloakClient, {
        initOptions,
        onPermissions: getPermissions,
    });
    const dataProvider = simpleRestProvider(
        '$API_URL',
        httpClient(keycloakClient)
    );
    // hide the admin until the authProvider is ready
    if (!authProvider) return <p>Loading...</p>;

    return (
        <Admin
            authProvider={authProvider}
            dataProvider={dataProvider}
            i18nProvider={i18nProvider}
            title="Example Admin"
            layout={Layout}
            // Make sure you use the LoginPage provided by ra-keycloak if you didn't set the onLoad keycloak init option to 'login-required'
            loginPage={LoginPage}
        >
            {permissions => (
                <>
                    <Resource name="posts" {...posts} />
                    <Resource name="comments" {...comments} />
                    <Resource name="tags" {...tags} />
                    {permissions === 'admin' ? (
                        <Resource name="users" {...users} />
                    ) : null}
                </>
            )}
        </Admin>
    );
};
export default App;
```

## `keycloakAuthProvider` Parameters

- `onPermissions` - _optional_ - function used to transform the permissions fetched from Keycloak into a permissions object in the form of what your react-admin app expects
- `loginRedirectUri` - _optional_ - URI used to override the redirect URI after successful login
- `logoutRedirectUri` - _optional_ - URI used to override the redirect URI after successful logout

## Demo

You can find a working demo, along with the source code, in this project's repository: https://github.com/marmelab/ra-keycloak

## License

This auth provider is licensed under the MIT License and sponsored by [marmelab](https://marmelab.com).
