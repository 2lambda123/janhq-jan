# Jan

Jan is a self-hosted, AI Inference Platform that scales from personal use to production deployments.

Run an entire AI stack locally, from the inference engine to a shareable web application.

Jan is free, source-available, and fair-code licensed.

> 👋 Access a live demo at https://cloud.jan.ai.

## Intended use
- Run ChatGPT and Midjourney alternatives on-prem and on your private data
- Self-host AI models for your friends or for a team
- GPU support with Nvidia hardware acceleration
- CPU support with optimizations via llama.cpp

## Current Features
- [x] Llama 7Bn
- [x] Web app and APIs (OpenAI compatible REST & GRPC)
- [x] Supports Apple Silicon/CPU & GPU architectures
- [x] Load balancing via Traefik
- [x] Login and authz via Keycloak
- [x] Data storage via Postgres, MinIO

## Planned Features
- [ ] Support more models, with acceleration ([WIP](https://github.com/janhq/accelerated_ai))
- [ ] C++ inference backend w/ CUDA & dynamic batching ([WIP](https://github.com/janhq/inference_backend))
- [ ] Universal model installer & compiler, targeting Nvidia GPU acceleration
- [ ] Mobile UI with a swappable backend URL
- [ ] Admin dashboards for user management and audit

## Quickstart

So far, this setup is tested and supported for Docker on Linux, Mac, and Windows Subsystem for Linux (WSL).

### Dependencies

- **Install Docker**: Install Docker [here](https://docs.docker.com/get-docker/).

- **Install Docker Compose**: Install Docker Compose [here](https://docs.docker.com/compose/install/).

- **Clone the Repository**: Clone this repository and pull in the latest git submodules.

  ```bash
  git clone https://github.com/janhq/jan.git

  cd jan

  # Pull latest submodules
  git submodule update --init --recursive
  ```

- **Export Environment Variables**
```sh
export DOCKER_DEFAULT_PLATFORM=linux/$(uname -m)
```

- **Set a .env**: You will need to set up several environment variables for services such as Keycloak and Postgres. You can place them in `.env` files in the respective folders as shown in the `docker-compose.yml`.

  ```bash
  cp sample.env .env
  ```

  | Service (Docker)       | env file                                                                                                                        |
  | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
  | Global env             | `.env`, just run `cp sample.env .env`                                                                                           |
  | Keycloak               | `.env` presented in global env and initiate realm in `conf/keycloak_conf/example-realm.json`                                    |
  | Keycloak PostgresDB    | `.env` presented in global env                                                                                                  |
  | jan-inference          | `.env` presented in global env                                                                                                  |
  | app-backend (hasura)   | `conf/sample.env_app-backend` refer from [here](https://hasura.io/docs/latest/deployment/graphql-engine-flags/config-examples/) |
  | app-backend PostgresDB | `conf/sample.env_app-backend-postgres`                                                                                          |
  | web-client             | `conf/sample.env_web-client`                                                                                                    |

### Install Models
```sh
wget https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGML/resolve/main/llama-2-7b-chat.ggmlv3.q4_1.bin -P jan-inference/llm/models
```

### Compose Up

Jan uses an opinionated, but modular, open-source stack that comes with many services out of the box, e.g. multiple clients, autoscaling, auth and more.

You can opt out of such services or swap in your own integrations via [Configurations](#configurations).

- Run the following command to start all the services defined in the `docker-compose.yml`

```shell
# Docker Compose up
docker compose up

# Docker Compose up detached mode
docker compose up -d
```

- This step takes 5-15 minutes and the following services will be provisioned:

| Service     | URL                   | Credentials                                                                                                                                                           |
| -------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web App           | http://localhost:3000 | Users are signed up to keycloak, default created user is set via `conf/keycloak_conf/example-realm.json` on keycloak with username: `username`, password: `password` |
| Keycloak Admin             | http://localhost:8088 | Admin credentials are set via the environment variables `KEYCLOAK_ADMIN` and `KEYCLOAK_ADMIN_PASSWORD`                                                               |
| Hasura App Backend | http://localhost:8080 | Admin credentials are set via the environment variables `HASURA_GRAPHQL_ADMIN_SECRET` in file `conf/sample.env_app-backend`                                          |
| LLM Service          | http://localhost:8000 |                                                                                                                                                                                                                                                                                          |

## Usage

- Launch the web application via `http://localhost:3000`.
- Login with default user (username: `username`, password: `password`)

## Configurations

TODO

## Developers

### Architecture

TODO

### Dependencies

- [Keycloak Community](https://github.com/keycloak/keycloak) (Apache-2.0)
- [Hasura Community Edition](https://github.com/hasura/graphql-engine) (Apache-2.0)

### Repo Structure

Jan is a monorepo that pulls in the following submodules

```shell
├── docker-compose.yml
├── mobile-client       # Mobile app
├── web-client          # Web app
├── app-backend         # Web & mobile app backend
├── inference-backend   # Inference server
├── docs                # Developer Docs
├── adrs                # Architecture Decision Records
```

## Common Issues and Troubleshooting

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to contribute to this project.

## License

This project is licensed under the Fair Code License. See [LICENSE.md](LICENSE.md) for more details.

## Authors and Acknowledgments

Created by Jan. Thanks to all contributors who have helped to improve this project.

## Contact

For support: please file a Github ticket
For questions: join our Discord [here](https://discord.gg/FTk2MvZwJH)
For long form inquiries: please email hello@jan.ai
