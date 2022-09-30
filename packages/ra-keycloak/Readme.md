# ra-keycloak

An auth provider for [react-admin](https://github.com/marmelab/react-admin) which handles authentication via a [Keycloak](https://www.keycloak.org/guides) server.

This package provides:

-   A `keycloakAuthProvider` for react-admin
-   `httpClient` which adds headers needed by Keycloak in all requests.

This package uses [keycloak-js](https://www.npmjs.com/package/keycloak-js) to handle the Keycloak authentication.

## Installation

```sh
yarn add ra-keycloak
# or
npm install ra-keycloak
```

## Usage

```jsx
// in src/App.js
  import i18nProvider from "./i18nProvider";
  import Layout from "./Layout";
  import posts from "./posts";

  import Keycloak, { KeycloakConfig } from "keycloak-js";
  import { keycloakAuthProvider } from "ra-keycloak/authProvider";

  const isPermitted = (decoded: KeycloakTokenParsed): boolean => {
    if (!decoded.resource_access) {
      return false;
    }
    const admin = decoded.resource_access["$KEYCLOAK_CLIENT_ID"].roles.find(
      (role) => role === "admin"
    );
    return !!admin;
  };
  

  const App = () => {
    const [authProvider, setAuthProvider] = React.useState<AuthProvider | null>(
      null
    );

    const [dataProvider, setDataProvider] = React.useState<DataProvider | null>(
      null
    );

    React.useEffect(() => {
      async function startAuthProvider() {
        const config: KeycloakConfig = {
           url: "$KEYCLOAK_URL",
           realm: "$KEYCLOAK_REALM",
           clientId: "$KEYCLOAK_CLIENT_ID",
        };

        const keycloak = new Keycloak(config);
        await keycloak.init({ onLoad: "login-required" });
        const authProvider = keycloakAuthProvider(keycloak, {onPermissions: isPermitted});
        setAuthProvider(authProvider);
        setDataProvider(dataProvider);
      }
      if (authProvider === null) {
        startAuthProvider();
      }
    }, [authProvider]);

    // hide the admin until the data provider is ready
    if (!authProvider) return <p>Loading...</p>;

    return (
      <Admin
        authProvider={authProvider}
        dataProvider={dataProvider}
        i18nProvider={i18nProvider}
        title="Example Admin"
        layout={Layout}
      >
        <>
          <Resource name="posts" {...posts} />
          {....}
        </>
      </Admin>
    );
  };
```

## License

This data provider is licensed under the MIT License and sponsored by [marmelab](https://marmelab.com).
