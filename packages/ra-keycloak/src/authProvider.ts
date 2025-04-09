import { AuthProvider, PreviousLocationStorageKey } from 'ra-core';
// FIXME: For some reason, TS does not find the types in the keycloak-js package (they are present though) unless we import from the lib folder
import jwt_decode from 'jwt-decode';
import Keycloak, {
    KeycloakInitOptions,
    KeycloakTokenParsed,
} from 'keycloak-js/lib/keycloak';

/**
 * An authProvider which handles authentication via the Keycloak server.
 * It requires wrapping your Application in a BrowserRouter (see https://marmelab.com/react-admin/Admin.html#using-a-custom-router)
 *
 * @example
 * ```tsx
 * import * as React from 'react';
 * import { Admin, Resource } from 'react-admin';
 * import simpleRestProvider from 'ra-data-simple-rest';
 * import Keycloak, {
 *     KeycloakConfig,
 *     KeycloakTokenParsed,
 *     KeycloakInitOptions,
 * } from 'keycloak-js';
 * import { keycloakAuthProvider, httpClient, LoginPage } from 'ra-keycloak';
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
 * const App = () => {
 *     const authProvider = keycloakAuthProvider(keycloakClient, {
 *         initOptions: { onLoad: 'login-required' },
 *         onPermissions: getPermissions,
 *     });
 *     const dataProvider = simpleRestProvider('$API_URL', httpClient(keycloakClient));
 *
 *     return (
 *         <Admin
 *             authProvider={authProvider.current}
 *             dataProvider={dataProvider.current}
 *             i18nProvider={i18nProvider}
 *             title="Example Admin"
 *             layout={Layout}
 *             loginPage={LoginPage}
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
 * @param keycloakClient The keycloak client. If unitialized will be initialized; if already initialized the `Promise` returned from `init` must have already resolved.
 * @param options.authenticationTimeout DEPRECATED: Unused by the provider
 * @param options.initOptions Optional. The options to pass to the Keycloak client init function
 * @param options.onPermissions Optional. function used to transform the permissions fetched from Keycloak into a permissions object in the form of what your react-admin app expects
 * @param options.loginRedirectUri Optional. URI used to override the redirect URI after successful login
 * @param options.logoutRedirectUri Optional. URI used to override the redirect URI after successful logout
 *
 * @returns an authProvider ready to be used by React-Admin.
 */
export const keycloakAuthProvider = (
    keycloakClient: Keycloak,
    options: {
        initOptions?: KeycloakInitOptions;
        authenticationTimeout?: number; // unused, retained for compatibility
        onPermissions?: PermissionsFunction;
        loginRedirectUri?: string;
        logoutRedirectUri?: string;
    } = {}
): AuthProvider => {
    let keycloakInitializationPromise: Promise<boolean> | null = null;

    // If passed in client is already initialized, prevent re-initialization
    // (This assumes that initialization is complete, i.e. the Promise that init returned has resolved)
    if (keycloakClient.didInitialize) {
        keycloakInitializationPromise = Promise.resolve(true);
    }

    /**
     * This function ensures keycloak is initialized by this provider only once.
     */
    const initKeyCloakClient = async () => {
        if (!keycloakInitializationPromise) {
            keycloakInitializationPromise = keycloakClient.init(
                options.initOptions
            );
        }

        return keycloakInitializationPromise;
    };

    return {
        async login() {
            let redirectUri = `${window.location.origin}/auth-callback`;
            if (options.loginRedirectUri) {
                if (!options.loginRedirectUri.startsWith('http')) {
                    redirectUri = `${window.location.origin}${options.loginRedirectUri}`;
                } else {
                    redirectUri = options.loginRedirectUri;
                }
            }
            await initKeyCloakClient();
            return keycloakClient.login({
                redirectUri,
            });
        },
        async logout() {
            let redirectUri = `${window.location.origin}/login`;
            if (options.logoutRedirectUri) {
                if (!options.logoutRedirectUri.startsWith('http')) {
                    redirectUri = `${window.location.origin}${options.logoutRedirectUri}`;
                } else {
                    redirectUri = options.logoutRedirectUri;
                }
            }
            await initKeyCloakClient();
            keycloakClient.logout({
                redirectUri,
            });
            // The Keycloak client will (forcefully) do its own redirection, so we need to disable
            // React-admin's redirection
            return false;
        },
        async checkError() {
            await initKeyCloakClient();
            if (keycloakClient.authenticated && keycloakClient.token) {
                return;
            }
            throw new Error('Failed to obtain access token.');
        },
        async checkAuth() {
            await initKeyCloakClient();
            if (keycloakClient.authenticated && keycloakClient.token) {
                return;
            }
            // not authenticated: save the location that the user tried to access
            localStorage.setItem(
                PreviousLocationStorageKey,
                window.location.href
                    .replace(window.location.origin, '')
                    // Make sure we return a react-router path independent of the router type
                    .replace('/#/', '/')
            );
            throw new Error('Failed to obtain access token.');
        },
        async getPermissions() {
            await initKeyCloakClient();
            if (!keycloakClient.authenticated || !keycloakClient.token) {
                return undefined;
            }
            const decoded = jwt_decode<KeycloakTokenParsed>(
                keycloakClient.token
            );
            return options.onPermissions
                ? options.onPermissions(decoded)
                : decoded;
        },
        async getIdentity() {
            await initKeyCloakClient();
            if (keycloakClient.authenticated && keycloakClient.token) {
                const decoded = jwt_decode<KeycloakTokenParsed>(
                    keycloakClient.token
                );
                const id = decoded.sub || '';
                const fullName = decoded.preferred_username;
                return { id, fullName };
            }
            throw new Error('Failed to get identity.');
        },
        async handleCallback() {
            await initKeyCloakClient();
            if (keycloakClient.authenticated && keycloakClient.token) {
                return;
            }
            throw new Error('Failed to obtain access token.');
        },
    };
};

export type PermissionsFunction = (decoded: KeycloakTokenParsed) => any;

export interface KeycloakAuthProviderOptions {
    onPermissions?: PermissionsFunction;
    loginRedirectUri?: string;
    logoutRedirectUri?: string;
}
