## 2.0.0

-   Upgrade `react-admin` to v5
-   Upgrade `keycloak-js` to v26
-   Remove prop-types

**Breaking changes**

The setup has been drastically simplified:

```diff
-import React, { useState, useRef, useEffect } from 'react';
+import React from 'react';
import { Admin } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';
import Keycloak, {
    KeycloakConfig,
    KeycloakTokenParsed,
    KeycloakInitOptions,
} from 'keycloak-js';
-import { keycloakAuthProvider, httpClient } from 'ra-keycloak';
+import { keycloakAuthProvider, httpClient, LoginPage } from 'ra-keycloak';

const config: KeycloakConfig = {
    url: '$KEYCLOAK_URL',
    realm: '$KEYCLOAK_REALM',
    clientId: '$KEYCLOAK_CLIENT_ID',
};

-const initOptions: KeycloakInitOptions = { onLoad: 'login-required' };
+const initOptions: KeycloakInitOptions = { onLoad: 'check-sso' };

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
-    const [keycloak, setKeycloak] = useState<Keycloak>(undefined);
-    const authProvider = useRef<AuthProvider>(undefined);
-    const dataProvider = useRef<DataProvider>(undefined);
+    const keycloakClient = new Keycloak(config);
+    const authProvider = keycloakAuthProvider(keycloakClient, {
+        initOptions,
+        onPermissions: getPermissions,
+    });
+    const dataProvider = simpleRestProvider(
+        '$API_URL',
+        httpClient(keycloakClient)
+    );
-    useEffect(() => {
-        const initKeyCloakClient = async () => {
-            // init the keycloak client
-            const keycloakClient = new Keycloak(config);
-            await keycloakClient.init(initOptions);
-            // use keycloakAuthProvider to create an authProvider
-            authProvider.current = keycloakAuthProvider(
-                keycloakClient,
-                raKeycloakOptions
-            );
-            // example dataProvider using the httpClient helper
-            dataProvider.current = simpleRestProvider(
-                '$API_URL',
-                httpClient(keycloakClient)
-            );
-            setKeycloak(keycloakClient);
-        };
-        if (!keycloak) {
-            initKeyCloakClient();
-        }
-    }, [keycloak]);
-
-    // hide the admin until the keycloak client is ready
-    if (!keycloak) return <p>Loading...</p>;

     return (
        <Admin
            authProvider={authProvider.current}
            dataProvider={dataProvider.current}
+           loginPage={LoginPage}
        >
            // ...
        </Admin>
     );
}
```

Note that `keycloakAuthProvider` now accepts the options the Keycloak client `initialize` method will be called with. You don't need to call `initialize` yourself anymore but you still can if needed.

Using the `keycloakAuthProvider` with an `HashRouter` (or `createHashRouter`) requires some additional steps:
    - setting the Keycloak `initialize` method `responseMode` option to `"query"`:
    - setting the `keycloakAuthProvider` `loginRedirectUri` option to `"/#/auth-callback"`
    - setting the `keycloakAuthProvider` `logoutRedirectUri` option to `"/#/login"` or any url that does not require users to be authenticated

This is because Keycloak passes its parameters for authentication in the URL hash fragment by default and it's not compatible with [createHashRouter](https://reactrouter.com/en/main/routers/create-hash-router) nor [`<HashRouter>`](https://reactrouter.com/en/main/router-components/hash-router).

# 1.0.1

* Fix compatibility with Keycloak 23.0 ([#7](https://github.com/marmelab/ra-keycloak/pull/7)) ([piettes](https://github.com/piettes))

## 1.0.0

* Initial release
