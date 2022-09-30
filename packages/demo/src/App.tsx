/* eslint react/jsx-key: off */
import * as React from 'react';
import { Admin, Resource, CustomRoutes, AuthProvider } from 'react-admin'; // eslint-disable-line import/no-unresolved
import { Route } from 'react-router-dom';

import comments from './comments';
import CustomRouteLayout from './customRouteLayout';
import CustomRouteNoLayout from './customRouteNoLayout';
import dataProvider from './dataProvider';
import i18nProvider from './i18nProvider';
import Layout from './Layout';
import posts from './posts';
import users from './users';
import tags from './tags';
import Keycloak, { KeycloakConfig } from 'keycloak-js';
import { keycloakAuthProvider } from 'ra-keycloak';

const App = () => {
    const [authProvider, setAuthProvider] = React.useState<AuthProvider | null>(
        null
    );

    React.useEffect(() => {
        async function startAuthProvider() {
            const config: KeycloakConfig = {
                url: 'http://localhost:8080/auth',
                realm: 'Marmelab',
                clientId: 'front-marmelab',
            };

            const keycloak = new Keycloak(config);
            await keycloak.init({ onLoad: 'login-required' });
            const authProvider = keycloakAuthProvider(keycloak, {});
            setAuthProvider(authProvider);
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
                {permissions => (
                    <>
                        {permissions ? (
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
                )}
                <CustomRoutes>
                    <Route
                        path="/custom3"
                        element={
                            <CustomRouteLayout title="Posts from /custom3" />
                        }
                    />
                </CustomRoutes>
            </>
        </Admin>
    );
};
export default App;
