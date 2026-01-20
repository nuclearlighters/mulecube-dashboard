FROM debian:bookworm-slim

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    bash \
    git \
    jq \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Hugo extended (v0.147.0 to satisfy PaperMod >= 0.146.0)
ARG HUGO_VERSION=0.147.0
RUN wget -q https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb \
    && dpkg -i hugo_extended_${HUGO_VERSION}_linux-amd64.deb \
    && rm hugo_extended_${HUGO_VERSION}_linux-amd64.deb

# Install MinIO client
RUN wget -q https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc && \
    chmod +x /usr/local/bin/mc

# Install Docker CLI + buildx plugin
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian bookworm stable" > /etc/apt/sources.list.d/docker.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends docker-ce-cli docker-buildx-plugin && \
    rm -rf /var/lib/apt/lists/*

# Bake in OpenBao CA certificate
RUN mkdir -p /etc/ssl/custom
COPY openbao-ca.crt /etc/ssl/custom/openbao-ca.crt
ENV BAO_CACERT=/etc/ssl/custom/openbao-ca.crt

WORKDIR /builds

LABEL maintainer="Nuclear Lighters Infrastructure"
LABEL description="Hugo static site builder with S3 upload and Docker buildx capabilities"
LABEL version="1.5"
