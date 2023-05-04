# backend

This repository contains the code for the backend of the AMAZe
event organization program.

## Stack

In our stack, we are using the following libraries:

* [NodeJS](https://nodejs.org)/[TypeScript](https://typescriptlang.org/)
* [express](https://expressjs.com/), a web server router/middleware
* [node-postgres](https://node-postgres.com/), a PostgreSQL driver for Node
* [socket.io](https://socket.io/), a real-time message facilitator (WebSocket/long-polling)

## Layout

The repository source code lies in `src/`. The entry point is `src/index.ts`.

All route handlers are found in `src/routes/`. Extra API declarations are found
in `src/api/`.

## Deployment

This repository should be placed in a folder with the `frontend` repository.
It will automatically serve the bundled `frontend`.

## AMAZe

This project was developed by Amanda Schlais, Marissa Manata,
Adam Grunwald, and Zander Franks.
