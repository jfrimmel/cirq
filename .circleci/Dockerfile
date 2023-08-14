FROM alpine:3.18

ENV PATH=/root/.cargo/bin:$PATH
RUN apk add --no-cache \
    # basic requirements for CircleCI images
    bash git dropbear tar gzip ca-certificates \
    # tools for the project
    ninja-is-really-ninja npm imagemagick rustup && \
    npm install -g typescript && \
    echo 1 | rustup-init --profile minimal -t wasm32-unknown-unknown
