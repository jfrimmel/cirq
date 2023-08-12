# CI definitions

## Building the Docker image
```bash
local -r VERSION=<...>
cirq$ docker build -t jfrimmel/cirq:$VERSION -t jfrimmel/cirq:latest .circleci/
cirq$ docker push jfrimmel/cirq:$VERSION
cirq$ docker push jfrimmel/cirq:latest
```
