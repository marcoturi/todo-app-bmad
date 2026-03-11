#!/usr/bin/env node
// Single-source healthcheck used by both Dockerfile HEALTHCHECK and docker-compose.yml.
fetch('http://localhost:3000/health')
  .then((r) => {
    process.exit(r.ok ? 0 : 1);
  })
  .catch(() => {
    process.exit(1);
  });
