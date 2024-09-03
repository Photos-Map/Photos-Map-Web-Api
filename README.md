# Photos-Map-Web-Api

## Running them locally without Docker

1. Install dependencies by running: `pnpm install`

2. To run the code in dev mode: `pnpm dev`

3. To build production code: `pnpm build`

4. To run the production code: `pnpm start`

## Running them locally with Docker

1. To build the app, run `docker build -t photos-map-web-api .`

2. To run the app, run `docker run -p 8080:3000 photos-map-web-api`

## Running lints and tests

1. To find linting issues, run `pnpm lint`

2. To fix linting issues, run `pnpm lint:fix`

3. To run tests, run `pnpm test`

## Generating keys

1. Generate public and private keys by running:

```
openssl genpkey -algorithm ed25519 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem
```

It will create two files: `private.pem` and `public.pem`.

2. Now, run this to set the `private.pem` file as the environment variable `JWT_PRIVATE_KEY`:

```
export JWT_PRIVATE_KEY=$(tr -d '\n' < private.pem)
```

3. Similarly, run this to set the `public.pem` file as the environment variable `JWT_PUBLIC_KEY`:

```
export JWT_PUBLIC_KEY=$(tr -d '\n' < public.pem)
```

## Sample requests:

http://localhost:3000/api/v1/photos?b=37.822x-123.775x36.771x-120.646


http://localhost:3000/api/v1/thumbnails/ANjHXp0EcYcPzYX-l9qSYr5WgVPuiO1zgtx35h_svfGKnhdw3r9JPuISoJ6YUDDXfs3F6YyQNBrz5D-jZFmm6oBNCSYCE3lqwA?account=vanillalatte98starbucks@gmail.com


http://localhost:3000/api/v1/thumbnails/ANjHXp2AXQC-o5-Kxy-m3d-4DLXGKmN9_sgaJ_addpazn5KfmhYzoUhjq_Jwd2l_OXP09s0DDqqwWhdaHScCWT5O30VERmvSzQ?account=vanillalatte98starbucks@gmail.com


http://localhost:3000/api/v1/thumbnails/AH9zPzxHhiHxjP53V9sux4afHspjOwyuMPWF2Ii1jOG9-rXZxjohyp07kqpzvXq0wIHup9zovXsMa2x8l5URietuCHV2F7Y3hA?account=spacexdragonsquirrel@gmail.com


http://localhost:3000/api/v1/thumbnails/AMG2qYeuP4exs7fowDt7cwHDenO5l-70dYT9SBnUaiQr56LWoQUUbOCyu5UHT4PpDAlJRnCb0DtIWEU698iGj_7f_QgfDCJ1bQ?account=emiliokartono.archive.software@gmail.com