import {
  getAssetFromKV,
  MethodNotAllowedError,
  NotFoundError,
} from '@cloudflare/kv-asset-handler'
import * as remixServerBuild from 'web'
import manifestJSON from '__STATIC_CONTENT_MANIFEST'

const assetManifest = JSON.parse(manifestJSON)
const assetPath = remixServerBuild.assets.url.split('/').slice(0, -1).join('/')

export async function getAssets(
  request: Request,
  url: URL,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  try {
    if (process.env.NODE_ENV === 'development') {
      return await getAssetFromKV(
        {
          request,
          waitUntil(promise) {
            return ctx.waitUntil(promise)
          },
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
          cacheControl: {
            bypassCache: true,
          },
        },
      )
    }

    const isStatic =
      url.pathname.startsWith(assetPath) ||
      url.pathname.startsWith('/assets/static/')
    const ttl = isStatic
      ? 31536000 // 1 year
      : 300 // 5 minutes;

    return await getAssetFromKV(
      {
        request,
        waitUntil(promise) {
          return ctx.waitUntil(promise)
        },
      },
      {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
        cacheControl: {
          browserTTL: ttl,
          edgeTTL: ttl,
        },
      },
    )
  } catch (error) {
    if (error instanceof NotFoundError) {
      return new Response('Not found', { status: 404 })
    } else if (error instanceof MethodNotAllowedError) {
      return new Response('Method not allowed', { status: 405 })
    } else {
      return new Response('An unexpected error occurred', { status: 500 })
    }
  }
}
