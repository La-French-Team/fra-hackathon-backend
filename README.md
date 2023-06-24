# poc-fra-hackathon-backend

A secret project where we simply change the world

## Locally

### Install

```bash
git clone git@github.com:grichka/poc-fra-hackathon-backend.git
npm i
```

### Run Tests

```bash
npm test
```

### Run App Server

```bash
npm start
```

## Docker

### Build image

```bash
docker build . -f docker/Dockerfile -t hackathon-backend
```

### Run Docker image

```bash
docker run -d --name hackathon-backend -p 3000:3000 hackathon-backend
```

### Environment variables

Name | Description
--|--
PORT | default: 3000
FASTIFY_CLOSE_GRACE_DELAY | default: 500
SDL_HOST | default: 'https://sdl.onerecord.fr'
SDL_API_KEY | default: 'xxx'
NEONE_HOST | default: 'https://neone.onerecord.fr'
