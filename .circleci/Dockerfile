FROM alpine:3.18

ENV PATH=/root/.cargo/bin:$PATH
RUN apk add --no-cache rustup && \
    rustup-init --profile minimal -t wasm32-unknown-unknown -y
RUN apk add --no-cache \
    # basic requirements for CircleCI images
    bash git dropbear tar gzip ca-certificates \
    # tools for the project
    ninja-is-really-ninja npm imagemagick build-base && \
    npm install -g typescript && \
    wget https://github.com/rustwasm/wasm-bindgen/releases/download/0.2.93/wasm-bindgen-0.2.93-x86_64-unknown-linux-musl.tar.gz -O - | tar -C $HOME/.cargo/bin --strip-components=1 -xz
