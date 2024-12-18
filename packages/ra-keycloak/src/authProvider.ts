import { AuthProvider, PreviousLocationStorageKey } from 'ra-core';
// FIXME: For some reason, TS does not find the types in the keycloak-js package (they are present though) unless we import from the lib folder
import Keycloak, {
    KeycloakTokenParsed,
    KeycloakInitOptions,
} from 'keycloak-js/lib/keycloak';
import jwt_decode from 'jwt-decode';

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
 * @param keycloakClient the keycloak client
 * @param options.authenticationTimeout The time to wait in milliseconds for Keycloak to detect authenticated users. Defaults to 2 seconds.
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
        authenticationTimeout?: number;
        onPermissions?: PermissionsFunction;
        loginRedirectUri?: string;
        logoutRedirectUri?: string;
    } = {}
): AuthProvider => ({
    async login() {
        let redirectUri = `${window.location.origin}/auth-callback`;
        if (options.loginRedirectUri) {
            if (!options.loginRedirectUri.startsWith('http')) {
                redirectUri = `${window.location.origin}${options.loginRedirectUri}`;
            } else {
                redirectUri = options.loginRedirectUri;
            }
        }
        await initKeyCloakClient(keycloakClient, options.initOptions);
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
        await initKeyCloakClient(keycloakClient, options.initOptions);
        keycloakClient.logout({
            redirectUri,
        });
        // The Keycloak client will (forcefully) do its own redirection, so we need to disable
        // React-admin's redirection
        return false;
    },
    async checkError() {
        await initKeyCloakClient(keycloakClient, options.initOptions);
        await isAuthenticated(keycloakClient, options.authenticationTimeout);
        if (keycloakClient.authenticated && keycloakClient.token) {
            return;
        }
        throw new Error('Failed to obtain access token.');
    },
    async checkAuth() {
        await initKeyCloakClient(keycloakClient, options.initOptions);
        await isAuthenticated(keycloakClient, options.authenticationTimeout);
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
        await initKeyCloakClient(keycloakClient, options.initOptions);
        await isAuthenticated(keycloakClient, options.authenticationTimeout);
        if (!keycloakClient.authenticated || !keycloakClient.token) {
            return undefined;
        }
        const decoded = jwt_decode<KeycloakTokenParsed>(keycloakClient.token);
        return options.onPermissions ? options.onPermissions(decoded) : decoded;
    },
    async getIdentity() {
        await initKeyCloakClient(keycloakClient, options.initOptions);
        await isAuthenticated(keycloakClient, options.authenticationTimeout);
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
        await initKeyCloakClient(keycloakClient, options.initOptions);
        await isAuthenticated(keycloakClient, options.authenticationTimeout);
        if (keycloakClient.authenticated && keycloakClient.token) {
            return;
        }
        throw new Error('Failed to obtain access token.');
    },
});

/**
 * It seems the Keycloak init function may initially return before having authenticated the user.
 * To ensure we have the correct state, we need to wait for the onAuthSuccess event.
 */
const isAuthenticated = (keycloakClient: Keycloak, timeout = 1000) => {
    return new Promise(resolve => {
        // Resolve immediately if already authenticated
        if (keycloakClient.authenticated && keycloakClient.token) {
            keycloakClient.onAuthSuccess = null;
            return resolve(true);
        }

        const timeoutId = setTimeout(() => {
            keycloakClient.onAuthSuccess = null;
            resolve(!!keycloakClient.authenticated);
        }, timeout);

        keycloakClient.onAuthSuccess = () => {
            clearTimeout(timeoutId);
            keycloakClient.onAuthSuccess = null;
            resolve(true);
        };
    });
};

let keycloakInitializationPromise: Promise<boolean> | undefined;
/**
 * This function ensures keycloak is initialized only once and only if needed.
 */
const initKeyCloakClient = async (
    keycloakClient: Keycloak,
    initOptions: KeycloakInitOptions = {}
) => {
    if (!keycloakClient) {
        return;
    }

    if (keycloakClient.didInitialize) {
        return keycloakClient.authenticated;
    }
    if (!keycloakInitializationPromise) {
        keycloakInitializationPromise = keycloakClient.init(initOptions);
    }

    return keycloakInitializationPromise;
};

export type PermissionsFunction = (decoded: KeycloakTokenParsed) => any;

export interface KeycloakAuthProviderOptions {
    onPermissions?: PermissionsFunction;
    loginRedirectUri?: string;
    logoutRedirectUri?: string;
}
