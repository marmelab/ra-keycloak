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

## Usage

Even though it is not required, we recommend you wrap your application inside a [Browser Router](https://marmelab.com/react-admin/Admin.html#using-a-custom-router) to avoid issues with Keycloak redirections after login.

```jsx
// in src/index.tsx
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { App } from './App';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
const router = createBrowserRouter([{ path: '*', element: <App /> }]);

root.render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);

// in src/App.tsx
import * as React from 'react';
import { Admin, Resource } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';
import Keycloak, {
    KeycloakConfig,
    KeycloakTokenParsed,
    KeycloakInitOptions,
} from 'keycloak-js';
import { keycloakAuthProvider, httpClient, LoginPage } from 'ra-keycloak';
import posts from './posts';
import users from './users';

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

const keycloakClient = new Keycloak(config);
const authProvider = keycloakAuthProvider(keycloakClient, {
    initOptions,
    onPermissions: getPermissions,
});
const dataProvider = simpleRestProvider(
    '$API_URL',
    httpClient(keycloakClient)
);

export const App = () => {
    return (
        <Admin
            authProvider={authProvider}
            dataProvider={dataProvider}
            // Make sure you use the LoginPage provided by ra-keycloak if you didn't set the onLoad keycloak init option to 'login-required'
            loginPage={LoginPage}
        >
            {permissions => (
                <>
                    <Resource name="posts" {...posts} />
                    {permissions === 'admin' ? (
                        <Resource name="users" {...users} />
                    ) : null}
                </>
            )}
        </Admin>
    );
};
```

## `keycloakAuthProvider` Parameters

A function that returns an `authProvider`. It requires a Keycloak client as its first parameter.

```tsx
// in src/dataProvider.ts
import { keycloakAuthProvider } from 'ra-keycloak';
import { keycloakClient } from './keycloakClient';

export const authProvider = keycloakAuthProvider(
    httpClient(keycloakClient),
    {
        initOptions: onLoad: 'check-sso',
    }
);
```

It also accept a second parameter with the following options:

| Option               | Required | Type     | Description                                                     |
| `onPermissions`      | Required | Function | A function used to transform the permissions fetched from Keycloak into a permissions object in the form of what your react-admin app expects |
| `loginRedirectUri`   |          | String   | The URI to which to redirect users after login |
| `logoutRedirectUri`  |          | String   | The URI to which to redirect users after logout |
| `initOptions`        |          | Object   | The options to pass to the Keycloak `init` function (See https://www.keycloak.org/securing-apps/javascript-adapter#_methods)  |

**Tip**: This function will take care of initializing the Keycloak client if not already done.

## `httpClient`

An Http client you can pass to many React-Admin data providers that will add the Keycloak authentication token to the requests headers. It requires a Keycloak client as its first parameter.

```tsx
// in src/dataProvider.ts
import { httpClient } from 'ra-keycloak';
import simpleRestProvider from 'ra-data-simple-rest';
import { keycloakClient } from './keycloakClient';

export const dataProvider = simpleRestProvider(
    '$API_URL',
    httpClient(keycloakClient)
);
```

## `<LoginPage>`

A custom React-Admin login page that call the Keycloak `login` method and automatically set the redirect URI to [the `/auth-callback` route](https://marmelab.com/react-admin/Authentication.html#using-external-authentication-providers).

```tsx
// in src/Admin.tsx
import * as React from 'react';
import { Admin } from 'react-admin';
import { LoginPage } from 'ra-keycloak';

export const App = () => {
    return (
        <Admin
            authProvider={authProvider}
            dataProvider={dataProvider}
            // Make sure you use the LoginPage provided by ra-keycloak if you didn't set the onLoad keycloak init option to 'login-required'
            loginPage={LoginPage}
        >
            {/* ... */}
        </Admin>
    );
};
```

## Demo

You can find a working demo, along with the source code, in this project's repository: https://github.com/marmelab/ra-keycloak

## License

This auth provider is licensed under the MIT License and sponsored by [marmelab](https://marmelab.com).
