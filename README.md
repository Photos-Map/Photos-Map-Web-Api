# Photos-Map-Web-Api

## Running them locally without Docker

1. Install dependencies by running: `pnpm install`

2. To run the code in dev mode: `pnpm dev`

3. To build production code: `pnpm build`

4. To run the production code: `pnpm start`

## Running them locally with Docker

1. To build the app, run `docker build -t photos-map-web-api .`

2. To run the app, run `docker run -p 8080:3000 photos-map-web-api`
