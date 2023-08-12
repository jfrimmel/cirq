FROM alpine:3.18

RUN apk add --no-cache \
    # basic requirements for CircleCI images
    bash git dropbear tar gzip ca-certificates \
    # tools for the project
    ninja-is-really-ninja npm rsvg-convert imagemagick && \
    npm install -g typescript
