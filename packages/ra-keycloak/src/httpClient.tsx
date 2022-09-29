import { fetchUtils } from 'react-admin';
import Keycloak from 'keycloak-js';

/**
 * The httpClient which adds headers with Keycloak token.
 * @param keycloak the client for the Keycloak authentication server.
 * @returns the response for the resource
 */
export const httpClient = (keycloak: Keycloak) => (
    url: any,
    options: fetchUtils.Options | undefined
) => {
    const requestHeaders = getKeycloakHeaders(keycloak.token, options);
    return fetchUtils.fetchJson(url, {
        ...options,
        headers: requestHeaders,
    });
};

/**
 * Return the headers with Keycloak token.
 * @param keycloak the client for the Keycloak authentication server.
 * @param options the options
 * @returns headers needed by Keycloak
 */
export const getKeycloakHeaders = (
    token: string | null,
    options: fetchUtils.Options | undefined
): Headers => {
    const headers = ((options && options.headers) ||
        new Headers({
            Accept: 'application/json',
        })) as Headers;
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
};
