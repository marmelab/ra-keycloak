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
import { keycloakAuthProvider, httpClient } from 'ra-keycloak';

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
const initOptions: KeycloakInitOptions = { onLoad: 'login-required' };

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

const raKeycloakOptions = {
    onPermissions: getPermissions,
};

const App = () => {
    const [keycloak, setKeycloak] = useState<Keycloak>(undefined);
    const authProvider = useRef<AuthProvider>(undefined);
    const dataProvider = useRef<DataProvider>(undefined);

    useEffect(() => {
        const initKeyCloakClient = async () => {
            // init the keycloak client
            const keycloakClient = new Keycloak(config);
            await keycloakClient.init(initOptions);
            // use keycloakAuthProvider to create an authProvider
            authProvider.current = keycloakAuthProvider(
                keycloakClient,
                raKeycloakOptions
            );
            // example dataProvider using the httpClient helper
            dataProvider.current = simpleRestProvider(
                '$API_URL',
                httpClient(keycloakClient)
            );
            setKeycloak(keycloakClient);
        };
        if (!keycloak) {
            initKeyCloakClient();
        }
    }, [keycloak]);

    // hide the admin until the keycloak client is ready
    if (!keycloak) return <p>Loading...</p>;

    return (
        <Admin
            authProvider={authProvider.current}
            dataProvider={dataProvider.current}
            i18nProvider={i18nProvider}
            title="Example Admin"
            layout={Layout}
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
