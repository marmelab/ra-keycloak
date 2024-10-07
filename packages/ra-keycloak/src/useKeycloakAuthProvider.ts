import { AuthProvider } from 'ra-core';
import { useEffect, useState, useRef } from 'react';
// FIXME: For some reason, TS does not find the types in the keycloak-js package (they are present though) unless we import from the lib folder
import Keycloak, { KeycloakInitOptions } from 'keycloak-js/lib/keycloak';
import {
    keycloakAuthProvider,
    KeycloakAuthProviderOptions,
} from './authProvider';

/**
 * A hook that returns an AuthProvider based on the Keycloak client.
 * @param keycloakClient The Keycloak client
 * @param options
 * @param options.initOptions The options to pass to the Keycloak client init method
 * @param options.onPermissions A function used to transform the permissions fetched from Keycloak into a permissions object in the form of what your react-admin app expects
 * @param options.loginRedirectUri URI used to override the redirect URI after successful login
 * @param options.logoutRedirectUri URI used to override the redirect URI after successful logout
 * @returns
 */
export const useKeycloakAuthProvider = (
    keycloakClient: Keycloak,
    { initOptions, ...authProviderOptions }: UseKeycloakAuthProviderOptions
): AuthProvider => {
    const initializingPromise = useRef<Promise<Keycloak> | undefined>(
        undefined
    );
    const [authProvider, setAuthProvider] = useState<AuthProvider>(undefined);

    useEffect(() => {
        const initKeyCloakClient = async () => {
            await keycloakClient.init(initOptions);
            setAuthProvider(
                keycloakAuthProvider(keycloakClient, authProviderOptions)
            );

            return keycloakClient;
        };

        // This ensures we only initialize the Keycloak client once with React StrictMode
        if (!initializingPromise.current) {
            // Make sure we don't initialize twice
            if (keycloakClient.didInitialize) {
                setAuthProvider(
                    keycloakAuthProvider(keycloakClient, authProviderOptions)
                );
                return;
            }
            initializingPromise.current = initKeyCloakClient().then(
                () => undefined
            );
        }
    }, [keycloakClient, authProviderOptions, initOptions]);

    return authProvider;
};

export interface UseKeycloakAuthProviderOptions
    extends KeycloakAuthProviderOptions {
    initOptions?: KeycloakInitOptions;
}
