# ra-keycloak

An auth provider for [react-admin](https://github.com/marmelab/react-admin) which handles authentication via a [Keycloak](https://www.keycloak.org/guides) server.

[![Documentation]][DocumentationLink] 
[![Source Code]][SourceCodeLink] 

[Documentation]: https://img.shields.io/badge/Documentation-darkgreen?style=for-the-badge
[Source Code]: https://img.shields.io/badge/Source_Code-blue?style=for-the-badge

[DocumentationLink]: ./packages/ra-keycloak/Readme.md 'Documentation'
[SourceCodeLink]: https://github.com/marmelab/ra-keycloak/tree/main/packages/ra-keycloak 'Source Code'

This repository contains:
- The actual `ra-keycloak` package
- A simple demo app you can run locally to try out `ra-keycloak`

## Simple Demo

### Prerequesites

This demo requires **Docker** and **docker compose** in order to start a local Keycloak server.

### Initial setup

1. Clone this project
1. Run `make install run` to install the dependencies, start the local Keycloak Server and start the Demo App

We need to add some minimal configuration to our Keycloak server in order to use it. This need to be done from the Keycloak Admin Console.

1. Browse to http://localhost:8080/auth/ (note: keycloak takes some time to start...)
1. Go to **Administration Console**
1. Login with the default credentials (admin / password)
1. Create a new **Realm** named for instance `Marmelab`
1. Create a new **Realm Role** named `admin`
1. Create a new **Realm Role** named `user`
1. Create a new **User** named `admin@marmelab.com`
1. For `admin@marmelab.com`, under **Credentials**, set a new password (disable the temporary password tick)
1. For `admin@marmelab.com`, under **Role mapping**, click **Assign role**, select **Filter by realm roles** and choose `admin`
1. Create a new **User** named `user@marmelab.com`
1. For `user@marmelab.com`, under **Credentials**, set a new password (disable the temporary password tick)
1. For `user@marmelab.com`, under **Role mapping**, click **Assign role**, select **Filter by realm roles** and choose `user`
1. Create a new **Client** and choose as **Client ID** `front-marmelab`. Leave all the other options to default.
1. For Client `front-marmelab`, under **Settings**, edit the **Access settings** to the following:
  - Root URL: http://localhost:8081/
  - Home URL: http://localhost:8081/
  - Valid redirect URIs: http://localhost:8081/*
  - Valid post logout redirect URIs: http://localhost:8081/*
  - Web origins: *
15. Click **Save**. Your keycloak instance is fully configured.

### Using the Simple Demo

Now that all is configured and running, you can browse to http://localhost:8081/ to access the React Admin App.

- Signing in with `user@marmelab.com` will only grant the `user` role permissions
- Signing in with `admin@marmelab.com` will grant full `admin` role permissions, allowing for instance to see the 'Users' resource in the main menu

Feel free to play around with this demo, along with the Keycloak config, to understand better how it works!

## License

This repository and the code it contains is licensed under the MIT License and sponsored by [marmelab](https://marmelab.com).
