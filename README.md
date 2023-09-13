# Jan - Self-Hosted AI Platform

<p align="center">
  <img alt="janlogo" src="https://user-images.githubusercontent.com/69952136/266827788-b37d6f41-fc34-4677-aa1f-3e2ca6d3c91a.png">
</p>

<p align="center">
  <!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
  <img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/m/janhq/jan"/>
  <img alt="Github Last Commit" src="https://img.shields.io/github/last-commit/janhq/jan"/>
  <img alt="Github Contributors" src="https://img.shields.io/github/contributors/janhq/jan"/>
  <img alt="GitHub closed issues" src="https://img.shields.io/github/issues-closed/janhq/jan"/>
  <img alt="Discord" src="https://img.shields.io/discord/1107178041848909847?label=discord"/>
</p>

<p align="center">
  <a href="https://docs.jan.ai/">Getting Started</a> - <a href="https://docs.jan.ai">Docs</a> 
  - <a href="https://docs.jan.ai/changelog/">Changelog</a> - <a href="https://github.com/janhq/jan/issues">Bug reports</a> - <a href="https://discord.gg/AsJ8krTT3N">Discord</a>
</p>

> ⚠️ **Jan is currently in Development**: Expect breaking changes and bugs!

Jan is a self-hosted AI Platform to run AI in the enterprise. Easy-to use for users, and packed with useful organizational and security features.

We help you run AI on your own hardware, with 1-click installs for the latest models. Jan runs on a wide variety of hardware: from consumer grade Mac Minis, to datacenter-grade Nvidia H100s. 

Jan can also connect to the latest AI engines like ChatGPT, with a security policy engine to protect your organization from sensitive data leaks.

Jan is free, source-available, and [fair-code](https://faircode.io/) licensed.

## Demo

👋 https://cloud.jan.ai

<p align="center">
  <img style='border:1px solid #000000' src="https://github.com/janhq/jan/assets/69952136/1f9bb48c-2e70-4633-9f68-7881cd925972" alt="Jan Web GIF">
</p>

## Features

**Self-Hosted AI**
- [x] Self-hosted Llama2 and LLMs 
- [x] Self-hosted StableDiffusion and Controlnet
- [ ] 1-click installs for Models (coming soon)

**3rd-party AIs**
- [ ] Connect to ChatGPT, Claude via API Key (coming soon)
- [ ] Security policy engine for 3rd-party AIs (coming soon)
- [ ] Pre-flight PII and Sensitive Data checks (coming soon)

**Multi-Device**
- [x] Web App
- [ ] Jan Mobile support for custom Jan server (in progress)
- [ ] Cloud deployments (coming soon)

**Organization Tools**
- [x] Multi-user support 
- [ ] Audit and Usage logs (coming soon)
- [ ] Compliance and Audit policy (coming soon)

**Hardware Support**

- [x] Nvidia GPUs 
- [x] Apple Silicon (in progress)
- [x] CPU support via llama.cpp
- [ ] Nvidia GPUs using TensorRT (in progress)

## Documentation

👋 https://docs.jan.ai (Work in Progress)

## Quick Start

To quickly get started with Jan, check out the [Quick Start Guide](/docs/docs/guides/quickstart.md)

> ⚠️ **Jan is currently in Development**: Expect breaking changes and bugs!

> [!NOTE]  
> Instruction below is for testing only, to deploy Jan to your production environment, checkout out the [Production Installation Guide](./docs/docs/guides/installation) (in progress)
> For help, please open an issue in this repository.


### Step 1: Install Docker

Jan is currently packaged as a Docker Compose application. 

- Docker ([Installation Instructions](https://docs.docker.com/get-docker/))
- Docker Compose ([Installation Instructions](https://docs.docker.com/compose/install/))

### Step 2: Clone Repo

```bash
git clone https://github.com/janhq/jan.git
cd jan

# Pull latest submodules
git submodule update --init --recursive
```

### Step 3: Configure `.env`

We provide a sample `.env` file that you can use to get started.

```shell
cp sample.env .env
```

You will need to set the following `env` file

- `.env` file

```shell
KEYCLOAK_VERSION=22.0.0 # KeyCloak version
KEYCLOAK_ADMIN=************* # Modify your own keycloak admin username
KEYCLOAK_ADMIN_PASSWORD=**** # Modify your own keycloak admin password

# Inference
## LLM
LLM_MODEL_URL=https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGML/resolve/main/llama-2-7b-chat.ggmlv3.q4_1.bin # URL to download the LLM Model
LLM_MODEL_FILE=llama-2-7b-chat.ggmlv3.q4_1.bin
```

- `conf/keycloak_conf/example-realm.json` file
  
  - Change default username and password 
    ![](./docs/static/img/docs_guides_quickstart_web_client_default_user.png)

  - Change default client id and secret
    ![](./docs/static/img/docs_guides_quickstart_keycloak_client.png)

- `conf/sample.env_app-backend` file

```shell
HASURA_GRAPHQL_METADATA_DATABASE_URL=postgres://postgres:postgrespassword@postgres:5432/jan-hasura-metadata
## this env var can be used to add the above postgres database to Hasura as a data source. this can be removed/updated based on your needs
PG_DATABASE_URL=postgres://postgres:postgrespassword@postgres:5432/jan-hasura-data
## enable the console served by server
HASURA_GRAPHQL_ENABLE_CONSOLE="true" # set to "false" to disable console
## enable debugging mode. It is recommended to disable this in production
HASURA_GRAPHQL_DEV_MODE="true"
HASURA_GRAPHQL_ENABLED_LOG_TYPES=startup, http-log, webhook-log, websocket-log, query-log

# HASURA_GRAPHQL_CONSOLE_ASSETS_DIR: /srv/console-assets
HASURA_GRAPHQL_ADMIN_SECRET=****************                                                                 # Modify your own secret key
HASURA_GRAPHQL_UNAUTHORIZED_ROLE="public"
HASURA_GRAPHQL_METADATA_DEFAULTS='{"backend_configs":{"dataconnector":{"athena":{"uri":"http://data-connector-agent:8081/api/v1/athena"},"mariadb":{"uri":"http://data-connector-agent:8081/api/v1/mariadb"},"mysql8":{"uri":"http://data-connector-agent:8081/api/v1/mysql"},"oracle":{"uri":"http://data-connector-agent:8081/api/v1/oracle"},"snowflake":{"uri":"http://data-connector-agent:8081/api/v1/snowflake"}}}}'
HASURA_GRAPHQL_JWT_SECRET={"jwk_url": "http://keycloak:8088/realms/hasura/protocol/openid-connect/certs"}    # Url to keycloak Realm openid-connect certs

# Environment variable for auto migrate
HASURA_GRAPHQL_MIGRATIONS_DIR=/migrations
HASURA_GRAPHQL_METADATA_DIR=/metadata
HASURA_GRAPHQL_ENABLE_CONSOLE='true'
HASURA_ACTION_STABLE_DIFFUSION_URL=http://sd:8000
HASURA_EVENTS_HOOK_URL="http://worker:8787"
```

- `conf/sample.env_web-client` file

```SHELL
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_WEB_URL=http://localhost:3000                                # Public url of the web-client
NEXT_PUBLIC_DISCORD_INVITATION_URL=#
NEXT_PUBLIC_DOWNLOAD_APP_IOS=#
NEXT_PUBLIC_DOWNLOAD_APP_ANDROID=#
NEXT_PUBLIC_GRAPHQL_ENGINE_URL=http://localhost:8080/v1/graphql          # app-backend http endpoint
NEXT_PUBLIC_GRAPHQL_ENGINE_WEB_SOCKET_URL=ws://localhost:8080/v1/graphql # app-backend websocket endpoint
KEYCLOAK_CLIENT_ID=*********                                             # Keycloak client id, configured in previous step
KEYCLOAK_CLIENT_SECRET=*****                                             # Keycloak client secret, configured in previous step
AUTH_ISSUER=http://localhost:8088/realms/$KEYCLOAK_CLIENT_ID
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=************                                             # Authen secret for web-client, modify your own
END_SESSION_URL=http://localhost:8088/realms/$KEYCLOAK_CLIENT_ID/protocol/openid-connect/logout
REFRESH_TOKEN_URL=http://localhost:8088/realms/$KEYCLOAK_CLIENT_ID/protocol/openid-connect/token
HASURA_ADMIN_TOKEN=*********                                             # Hasura admin secret, configured in app-backend config step

```

For more detail of all configuration, checkout to [configuration](./docs/docs/guides/configuration/)

### Step 4: Install Models

> Note: This step will change soon with [Nitro](https://github.com/janhq/nitro) becoming its own library

Install Mamba to handle native python binding (which can yield better performance on Mac M/ NVIDIA)
```bash
curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Mambaforge-$(uname)-$(uname -m).sh"
bash Mambaforge-$(uname)-$(uname -m).sh
rm Mambaforge-$(uname)-$(uname -m).sh

# Create environment
conda create -n jan python=3.9.16
conda activate jan
pip uninstall llama-cpp-python -y
```

- On Mac
```bash
CMAKE_ARGS="-DLLAMA_METAL=on" FORCE_CMAKE=1 pip install -U llama-cpp-python --no-cache-dir
pip install 'llama-cpp-python[server]'
```
- On Linux with NVIDIA GPU
```bash
CMAKE_ARGS="-DLLAMA_HIPBLAS=on" FORCE_CMAKE=1 pip install llama-cpp-python
pip install 'llama-cpp-python[server]'
```
- On Linux with Intel/ AMD CPU (support for AVX-2/ AVX-512)

```bash
CMAKE_ARGS="-DLLAMA_BLAS=ON -DLLAMA_BLAS_VENDOR=OpenBLAS" FORCE_CMAKE=1 pip install llama-cpp-python
pip install 'llama-cpp-python[server]'
```

We recommend that Llama2-7B (4-bit quantized) as a basic model to get started.

You will need to download the models to the `models` folder at root level.

```shell
# Downloads model (~4gb)
# Download time depends on your internet connection and HuggingFace's bandwidth
# In this part, please head over to any source contains `.gguf` format model - https://huggingface.co/models?search=gguf
wget https://huggingface.co/TheBloke/CodeLlama-13B-GGUF/resolve/main/codellama-13b.Q3_K_L.gguf -P models
```

- Run the model in host machine
```bash
# Please change the value of --model key as your corresponding model path
# The --n_gpu_layers 1 means using acclerator (can be Metal on Mac, NVIDIA GPU on on linux with NVIDIA GPU)
# This service will run at `http://localhost:8000` in host level
# The backend service inside docker compose will connect to this service by using `http://host.docker.internal:8000`
python3 -m llama_cpp.server --model models/codellama-13b.Q3_K_L.gguf --n_gpu_layers 1
```

### Step 5: `docker compose up`

Jan utilizes Docker Compose to run all services:

```shell
docker compose up -f docker-compose.develop.yml -d # Detached mode
```
-  (Backend)
- [Keycloak](https://www.keycloak.org/) (Identity)

The table below summarizes the services and their respective URLs and credentials.

| Service                                          | Container Name       | URL and Port          | Credentials                                                                        |
| ------------------------------------------------ | -------------------- | --------------------- | ---------------------------------------------------------------------------------- |
| Jan Web                                          | jan-web-*            | http://localhost:3000 | Set in `conf/keycloak_conf/example-realm.json` <br />- Default Username / Password |
| [Hasura](https://hasura.io) (Backend)            | jan-graphql-engine-* | http://localhost:8080 | Set in `conf/sample.env_app-backend` <br /> - `HASURA_GRAPHQL_ADMIN_SECRET`        |
| [Keycloak](https://www.keycloak.org/) (Identity) | jan-keycloak-*       | http://localhost:8088 | Set in `.env` <br />- `KEYCLOAK_ADMIN` <br />- `KEYCLOAK_ADMIN_PASSWORD`           |
| Inference Service                                | jan-llm-*            | http://localhost:8000 | Set in `.env`                                                                      |
| PostgresDB                                       | jan-postgres-*       | http://localhost:5432 | Set in `.env`                                                                      |

### Step 6: Use Jan

- Launch the web application via `http://localhost:3000`.
- Login with default user (username: `username`, password: `password` or the one that be modified)

## About Jan

Jan is a commercial company with a [Fair Code](https://faircode.io/) business model. This means that while we are open-source and can used for free, we require commercial licenses for specific use cases (e.g. hosting Jan as a service). 

We are a team of engineers passionate about AI, productivity and the future of work. We are funded through consulting contracts and enterprise licenses. Feel free to reach out to us!

### Repo Structure

Jan comprises of several repositories: 

| Repo                                                    | Purpose                                                                                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Jan](https://github.com/janhq/jan)                     | AI Platform to run AI in the enterprise. Easy-to-use for users, and packed with useful organizational and compliance features.                                |
| [Jan Mobile](https://github.com/janhq/jan-react-native) | Mobile App that can be pointed to a custom Jan server.                                                                                                        |
| [Nitro](https://github.com/janhq/nitro)                 | Inference Engine that runs AI on different types of hardware. Offers popular API formats (e.g. OpenAI, Clipdrop). Written in C++ for blazing fast performance |

### Architecture

Jan builds on top of several open-source projects:

- [Keycloak Community](https://github.com/keycloak/keycloak) (Apache-2.0)
- [Hasura Community Edition](https://github.com/hasura/graphql-engine) (Apache-2.0)

We may re-evaluate this in the future, given different customer requirements. 


### Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to contribute to this project.

Please note that Jan intends to build a sustainable business that can provide high quality jobs to its contributors. If you are excited about our mission and vision, please contact us to explore opportunities. 

### Contact

- For support: please file a Github ticket
- For questions: join our Discord [here](https://discord.gg/FTk2MvZwJH)
- For long form inquiries: please email hello@jan.ai
