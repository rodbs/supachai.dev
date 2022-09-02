# supachai.dev

This is my personal website.

## Features

In addition to being my digital resume,
this website can be used to publish atomic notes.

## Architecture

I decide to decouple data from code.
So, when contents get updated,
there is no need to rebuild or redeploy the website.

### Code

- Use [Remix](https://remix.run) as a center-stack web framework.
- Deploy the Remix build on [Cloudflare Workers](https://workers.cloudflare.com).

### Data

- Use [Cloudflare Workers KV](https://developers.cloudflare.com/workers/runtime-apis/kv/) as a global, low-latency, key-value data store.
