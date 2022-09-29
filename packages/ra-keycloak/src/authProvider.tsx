import { AuthProvider } from 'ra-core';
import Keycloak, { KeycloakTokenParsed } from 'keycloak-js';
import jwt_decode from 'jwt-decode';

export type PermissionsFunction = (decoded: KeycloakTokenParsed) => boolean;

/**
 * An authProvider which handles authentication via the Keycloak server.
 *
 * @example
 * import dataProvider from "./dataProvider";
 * import i18nProvider from "./i18nProvider";
 * import Layout from "./Layout";
 * import posts from "./posts";
 *
 * import Keycloak, { KeycloakConfig } from "keycloak-js";
 * import { keycloakAuthProvider } from "ra-keycloak/authProvider";
 *
 * const isPermitted = (decoded: KeycloakTokenParsed): boolean => {
 *   if (!decoded.resource_access) {
 *     return false;
 *   }
 *   const admin = decoded.resource_access["$KEYCLOAK_CLIENT_ID"].roles.find(
 *     (role) => role === "admin"
 *   );
 *   return !!admin;
 * };
 *
 * const App = () => {
 *   const [authProvider, setAuthProvider] = React.useState<AuthProvider | null>(
 *     null
 *   );
 *
 *   React.useEffect(() => {
 *     async function startAuthProvider() {
 *       const config: KeycloakConfig = {
 *          url: "$KEYCLOAK_URL",
 *          realm: "$KEYCLOAK_REALM",
 *          clientId: "$KEYCLOAK_CLIENT_ID",
 *       };
 *
 *       const keycloak = new Keycloak(config);
 *       await keycloak.init({ onLoad: "login-required" });
 *       const authProvider = keycloakAuthProvider(keycloak, {onPermissions: isPermitted});
 *       setAuthProvider(authProvider);
 *     }
 *     if (authProvider === null) {
 *       startAuthProvider();
 *     }
 *   }, [authProvider]);
 *
 *   // hide the admin until the data provider is ready
 *   if (!authProvider) return <p>Loading...</p>;
 *
 *   return (
 *     <Admin
 *       authProvider={authProvider}
 *       dataProvider={dataProvider}
 *       i18nProvider={i18nProvider}
 *       title="Example Admin"
 *       layout={Layout}
 *     >
 *       <>
 *         <Resource name="posts" {...posts} />
 *         {....}
 *       </>
 *     </Admin>
 *   );
 * };
 *
 * @param {PermissionsFunction} onPermissions the function to decide if the authenticated user has the right to access to a specific resource.
 * @returns {object} the authProvider object used by React-Admin.
 */

export const keycloakAuthProvider = (
    client: Keycloak,
    options: {
        onPermissions?: PermissionsFunction;
        redirectLogin?: string;
        redirectLogout?: string;
    } = {}
): AuthProvider => ({
    async login() {
        return client.login({
            redirectUri:
                options.redirectLogin ?? window.location.origin + '/#/',
        });
    },
    async logout() {
        return client.logout({
            redirectUri:
                options.redirectLogout ?? window.location.origin + '/#/login',
        });
    },
    async checkError() {
        return;
    },
    async checkAuth() {
        return client.authenticated && client.token
            ? Promise.resolve()
            : Promise.reject('Failed to obtain access token.');
    },
    async getPermissions() {
        if (!client.token) {
            return Promise.resolve(false);
        }
        const decoded = jwt_decode<KeycloakTokenParsed>(client.token);
        return Promise.resolve(options.onPermissions(decoded));
    },
    async getIdentity() {
        if (client.token) {
            const decoded = jwt_decode<KeycloakTokenParsed>(client.token);
            const id = decoded.sub || '';
            const fullName = decoded.name;
            return Promise.resolve({ id, fullName });
        }
        return Promise.reject('Failed to get identity.');
    },
});
