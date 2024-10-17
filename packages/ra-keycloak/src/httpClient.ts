// FIXME: For some reason, TS does not find the types in the keycloak-js package (they are present though) unless we import from the lib folder
import Keycloak from 'keycloak-js/lib/keycloak';
import { fetchUtils } from 'ra-core';

/**
 * The httpClient which adds headers needed by Keycloak in all requests.
 * @param keycloak the client for the Keycloak authentication server.
 * @returns a function with the same definition as `httpClient`, which adds headers needed by Keycloak in all requests.
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
 * Return the headers needed by Keycloak.
 * @param token the Keycloak token
 * @param options the fetch options (so that we do not override other headers)
 * @returns the headers needed by Keycloak
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
