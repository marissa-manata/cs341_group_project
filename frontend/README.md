# frontend

The frontend of AMAZe, the project of Team 3 in CS341, Fall 2022.

## Stack

In our frontend stack, we are using the following libraries:

* [React](https://reactjs.org/), a UI library
* [TypeScript](https://typescriptlang.org/), JavaScript with static type checking
* [Chakra UI](https://chakra-ui.com/), a component library for React
* [socket.io](https://socket.io/), a real-time message facilitator (WebSocket/long-polling). Used for real-time notifications

## Layout

The repository source code lies in `src/`. The entry point is `src/index.tsx`.

All pages are in folders in `src/views/`. Definitions for all pages are in `src/App.tsx`.
Generally, all `.tsx` files export at least one React component, which could be anything from
a simple button to an entire page. Most, if not all, components are commented and explain their
purpose and use.

## User help manual

Our user help manual code can be found in `src/About/index.tsx`. Other help information is
visible on some pages, and can be found when the `<Help>` component is used.

## Deployment

This repository should be placed in a folder with the `backend` repository. The `backend` will
automatically serve a bundled version of this repository.

## Set up

`npm i`

### Development

`npm run start`

### Production

`npm run build`

Run `backend` using `npm run start` in that folder

## AMAZe

This project was developed by Amanda Schlais, Marissa Manata, Adam Grunwald, and Zander Franks.
