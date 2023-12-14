/* eslint react/jsx-key: off */
import React, { useState, useRef, useEffect } from 'react';
import {
    Admin,
    Resource,
    CustomRoutes,
    AuthProvider,
    DataProvider,
} from 'react-admin';
import { Route } from 'react-router-dom';
import Keycloak, {
    KeycloakConfig,
    KeycloakTokenParsed,
    KeycloakInitOptions,
} from 'keycloak-js';
import { keycloakAuthProvider } from 'ra-keycloak';

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

const initOptions: KeycloakInitOptions = { onLoad: 'login-required' };

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
    const [keycloak, setKeycloak] = useState<Keycloak>(undefined);
    const initializingPromise = useRef<Promise<Keycloak>>(undefined);
    const authProvider = useRef<AuthProvider>(undefined);
    const dataProvider = useRef<DataProvider>(undefined);

    useEffect(() => {
        const initKeyCloakClient = async () => {
            const keycloakClient = new Keycloak(config);
            await keycloakClient.init(initOptions);
            authProvider.current = keycloakAuthProvider(keycloakClient, {
                onPermissions: getPermissions,
            });
            dataProvider.current = keyCloakTokenDataProviderBuilder(
                myDataProvider,
                keycloakClient
            );

            return keycloakClient;
        };
        if (!initializingPromise.current) {
            initializingPromise.current = initKeyCloakClient();
        }

        initializingPromise.current.then(keycloakClient => {
            setKeycloak(keycloakClient);
        });
    }, [keycloak]);

    // hide the admin until the dataProvider and authProvider are ready
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
