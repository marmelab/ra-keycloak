import { AuthProvider } from 'react-admin';
// FIXME: For some reason, TS does not find the types in the keycloak-js package (they are present though) unless we import from the lib folder
import Keycloak, { KeycloakTokenParsed } from 'keycloak-js/lib/keycloak';
import jwt_decode from 'jwt-decode';

/**
 * An authProvider which handles authentication via the Keycloak server.
 *
 * @example
 * ```tsx
 * import React, { useState, useRef, useEffect } from 'react';
 * import { Admin, Resource, AuthProvider, DataProvider } from 'react-admin';
 * import simpleRestProvider from 'ra-data-simple-rest';
 * import Keycloak, {
 *     KeycloakConfig,
 *     KeycloakTokenParsed,
 *     KeycloakInitOptions,
 * } from 'keycloak-js';
 * import { keycloakAuthProvider, httpClient } from 'ra-keycloak';
 *
 * import comments from './comments';
 * import i18nProvider from './i18nProvider';
 * import Layout from './Layout';
 * import posts from './posts';
 * import users from './users';
 * import tags from './tags';
 *
 * const config: KeycloakConfig = {
 *     url: '$KEYCLOAK_URL',
 *     realm: '$KEYCLOAK_REALM',
 *     clientId: '$KEYCLOAK_CLIENT_ID',
 * };
 *
 * // here you can set options for the keycloak client
 * const initOptions: KeycloakInitOptions = { onLoad: 'login-required' };
 *
 * // here you can implement the permission mapping logic for react-admin
 * const getPermissions = (decoded: KeycloakTokenParsed) => {
 *     const roles = decoded?.realm_access?.roles;
 *     if (!roles) {
 *         return false;
 *     }
 *     if (roles.includes('admin')) return 'admin';
 *     if (roles.includes('user')) return 'user';
 *     return false;
 * };
 *
 * const raKeycloakOptions = {
 *     onPermissions: getPermissions,
 * };
 *
 * const App = () => {
 *     const [keycloak, setKeycloak] = useState<Keycloak>(undefined);
 *     const authProvider = useRef<AuthProvider>(undefined);
 *     const dataProvider = useRef<DataProvider>(undefined);
 *
 *     useEffect(() => {
 *         const initKeyCloakClient = async () => {
 *             // init the keycloak client
 *             const keycloakClient = new Keycloak(config);
 *             await keycloakClient.init(initOptions);
 *             // use keycloakAuthProvider to create an authProvider
 *             authProvider.current = keycloakAuthProvider(
 *                 keycloakClient,
 *                 raKeycloakOptions
 *             );
 *             // example dataProvider using the httpClient helper
 *             dataProvider.current = simpleRestProvider(
 *                 '$API_URL',
 *                 httpClient(keycloakClient)
 *             );
 *             setKeycloak(keycloakClient);
 *         };
 *         if (!keycloak) {
 *             initKeyCloakClient();
 *         }
 *     }, [keycloak]);
 *
 *     // hide the admin until the keycloak client is ready
 *     if (!keycloak) return <p>Loading...</p>;
 *
 *     return (
 *         <Admin
 *             authProvider={authProvider.current}
 *             dataProvider={dataProvider.current}
 *             i18nProvider={i18nProvider}
 *             title="Example Admin"
 *             layout={Layout}
 *         >
 *             {permissions => (
 *                 <>
 *                     <Resource name="posts" {...posts} />
 *                     <Resource name="comments" {...comments} />
 *                     <Resource name="tags" {...tags} />
 *                     {permissions === 'admin' ? (
 *                         <Resource name="users" {...users} />
 *                     ) : null}
 *                 </>
 *             )}
 *         </Admin>
 *     );
 * };
 * ```
 *
 * @param client the keycloak client
 * @param options.onPermissions function used to transform the permissions fetched from Keycloak into a permissions object in the form of what your react-admin app expects
 * @param options.loginRedirectUri URI used to override the redirect URI after successful login
 * @param options.logoutRedirectUri URI used to override the redirect URI after successful logout
 *
 * @returns an authProvider ready to be used by React-Admin.
 */
export const keycloakAuthProvider = (
    client: Keycloak,
    options: {
        onPermissions?: PermissionsFunction;
        loginRedirectUri?: string;
        logoutRedirectUri?: string;
    } = {}
): AuthProvider => ({
    async login() {
        return client.login({
            redirectUri:
                options.loginRedirectUri ??
                `${window.location.origin}/#/auth-callback`,
        });
    },
    async logout() {
        return client
            .logout({
                redirectUri:
                    options.logoutRedirectUri ??
                    `${window.location.origin}#/login`,
            })
            .catch(error => {
                console.error(error);
            });
    },
    async checkError() {
        return client.authenticated && client.token
            ? Promise.resolve()
            : Promise.reject(new Error('Failed to obtain access token.'));
    },
    async checkAuth() {
        return client.authenticated && client.token
            ? Promise.resolve()
            : Promise.reject(new Error('Failed to obtain access token.'));
    },
    async getPermissions() {
        if (!client.token) {
            return Promise.resolve(false);
        }
        const decoded = jwt_decode<KeycloakTokenParsed>(client.token);
        return Promise.resolve(
            options.onPermissions ? options.onPermissions(decoded) : decoded
        );
    },
    async getIdentity() {
        if (client.token) {
            const decoded = jwt_decode<KeycloakTokenParsed>(client.token);
            const id = decoded.sub || '';
            const fullName = decoded.preferred_username;
            return Promise.resolve({ id, fullName });
        }
        return Promise.reject('Failed to get identity.');
    },
    handleCallback(params: any) {
        return client.authenticated && client.token
            ? Promise.resolve()
            : Promise.reject('Failed to obtain access token.');
    },
});

export type PermissionsFunction = (decoded: KeycloakTokenParsed) => any;

export interface KeycloakAuthProviderOptions {
    onPermissions?: PermissionsFunction;
    loginRedirectUri?: string;
    logoutRedirectUri?: string;
}
