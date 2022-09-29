# React-admin Simple Example

This a simple example built with [react-admin](https://github.com/marmelab/react-admin).
This version uses [ra-keycloak](https://github.com/marmelab/ra-keycloak).

## How to run

Inside the demo folder, run:

```sh

```sh
make install
```

You can launch a `Keycloak` server, a datebase `Postgres` and the `React-admin` via the command 

```sh
make start
```

## Usage
We assume you already know how to use Keycloak. If not, you can go [here](https://www.keycloak.org/guides)
To be able to use the demo you must at least create a Realm, a client and a user in Keycloak.
It is also necessary to configure the redirection URI and the origin for the Client
- KeyCloak server is launched on the port 8080.
- Postgres server is launched on the port 5432.
- React-admin is launched on the port 3000.
