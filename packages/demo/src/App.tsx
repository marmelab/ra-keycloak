import React from 'react';
import { Admin, Resource, CustomRoutes } from 'react-admin';
import { Route } from 'react-router-dom';
import Keycloak, {
    KeycloakConfig,
    KeycloakTokenParsed,
    KeycloakInitOptions,
    // FIXME: For some reason, TS does not find the types in the keycloak-js package (they are present though) unless we import from the lib folder
    // @ts-ignore
} from 'keycloak-js';
import { LoginPage, keycloakAuthProvider } from 'ra-keycloak';

import comments from './comments';
import CustomRouteLayout from './customRouteLayout';
import CustomRouteNoLayout from './customRouteNoLayout';
import myDataProvider, {
    keyCloakTokenDataProviderBuilder,
} from './dataProvider';
import i18nProvider from './i18nProvider';
import Layout from './Layout';
import posts from './posts';
import users from './users';
import tags from './tags';

const config: KeycloakConfig = {
    url: 'http://localhost:8080/auth',
    realm: 'Marmelab',
    clientId: 'front-marmelab',
};

const initOptions: KeycloakInitOptions = {
    // Optional: makes Keycloak check that a user session already exists when it initializes
    // and immediately consider the user as authenticated if one exists.
    onLoad: 'check-sso',
    // Optional: makes Keycloak check that a user session already exists when it initializes and redirect them to the Keycloak login page if not.
    // It's not necessary with react-admin as it already has a process for that (authProvider.checkAuth)
    // onLoad: 'login-required',
    // Required when using react-router HashRouter (or createHashRouter)
    // responseMode: 'query',
};

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

const dataProvider = keyCloakTokenDataProviderBuilder(
    myDataProvider,
    keycloakClient
);

const App = () => {
    return (
        <Admin
            authProvider={authProvider}
            dataProvider={dataProvider}
            i18nProvider={i18nProvider}
            title="Example Admin"
            layout={Layout}
            // Optional when using login-required init option on keycloak
            loginPage={LoginPage}
        >
            {permissions => (
                <>
                    <CustomRoutes noLayout>
                        <Route
                            path="/custom"
                            element={
                                <CustomRouteNoLayout title="Posts from /custom" />
                            }
                        />
                    </CustomRoutes>
                    <Resource name="posts" {...posts} />
                    <Resource name="comments" {...comments} />
                    <Resource name="tags" {...tags} />
                    {permissions ? (
                        <>
                            {permissions === 'admin' ? (
                                <Resource name="users" {...users} />
                            ) : null}
                            <CustomRoutes noLayout>
                                <Route
                                    path="/custom1"
                                    element={
                                        <CustomRouteNoLayout title="Posts from /custom1" />
                                    }
                                />
                            </CustomRoutes>
                            <CustomRoutes>
                                <Route
                                    path="/custom2"
                                    element={
                                        <CustomRouteLayout title="Posts from /custom2" />
                                    }
                                />
                            </CustomRoutes>
                        </>
                    ) : null}
                    <CustomRoutes>
                        <Route
                            path="/custom3"
                            element={
                                <CustomRouteLayout title="Posts from /custom3" />
                            }
                        />
                    </CustomRoutes>
                </>
            )}
        </Admin>
    );
};
export default App;
