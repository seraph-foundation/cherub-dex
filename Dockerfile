#
# Docker image to generate deterministic, verifiable builds of Anchor programs.
#

FROM --platform=linux/amd64 ubuntu:18.04

ARG DEBIAN_FRONTEND=noninteractive

ENV HOME="/root"
ENV PATH="${HOME}/.cargo/bin:${PATH}"
ENV PATH="${HOME}/.local/share/solana/install/active_release/bin:${PATH}"
ENV PATH="${HOME}/.nvm/versions/node/v17.0.1/bin:${PATH}"

# Install base utilities.
RUN mkdir -p /workdir && mkdir -p /tmp && \
    apt-get update -qq && apt-get upgrade -qq && apt-get install -qq \
    build-essential git curl wget jq pkg-config python3-pip \
    libssl-dev libudev-dev

# Install rust.
RUN curl "https://sh.rustup.rs" -sfo rustup.sh && \
    sh rustup.sh -y && \
    rustup component add rustfmt clippy

# Install node / npm / yarn.
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
ENV NVM_DIR="${HOME}/.nvm"
RUN . $NVM_DIR/nvm.sh && \
    nvm install node --latest-npm && \
    nvm use node && \
    nvm alias default node && \
    npm install -g yarn

# Install Solana tools.
RUN sh -c "$(curl -sSfL https://release.solana.com/v1.8.2/install)"

# Install anchor.
RUN cargo install --git https://github.com/project-serum/anchor --tag v0.16.2 anchor-cli --locked

# Build a dummy program to bootstrap the BPF SDK (doing this speeds up builds).
RUN mkdir -p /tmp && cd tmp && anchor init dummy && cd dummy && anchor build

WORKDIR /workdir
#FROM --platform=linux/amd64 debian:latest
#RUN apt-get update
#ENV NODE_VERSION=12.6.0
#RUN apt install -y curl build-essential
#RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
#ENV NVM_DIR=/root/.nvm
#RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
#RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
#RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
#ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"
#RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs -y | sh
#RUN echo 'source $HOME/.cargo/env' >> $HOME/.bashrc
#RUN sh -c "$(curl -sSfL https://release.solana.com/v1.8.0/install)"
#RUN npm i -g mocha yarn @project-serum/anchor-cli@0.16.2
#ENV PATH="/root/.local/share/solana/install/active_release/bin:${PATH}"
#RUN mkdir /code
#WORKDIR /code

CMD ["tail", "-f", "/dev/null"]
