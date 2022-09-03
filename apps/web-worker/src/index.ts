import {
  AppLoadContext,
  createCookieSessionStorage,
  createRequestHandler,
} from '@remix-run/cloudflare'
import * as remixServerBuild from 'web'
import { getAssets } from './utils'

const assetPath = remixServerBuild.assets.url.split('/').slice(0, -1).join('/')
const remixRequestHandler = createRequestHandler(
  {
    ...remixServerBuild,
    publicPath: '/build/',
    assetsBuildDirectory: 'public/build/',
  },
  process.env.NODE_ENV,
)

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const tlsVersion = request.cf?.tlsVersion
    if (tlsVersion !== 'TLSv1.2' && tlsVersion !== 'TLSv1.3') {
      return new Response('You need to use TLS version 1.2 or higher.', {
        status: 403,
      })
    }

    const url = new URL(request.url)
    if (isAsset(url.pathname)) {
      const response = await getAssets(request, url, env, ctx)
      if (response) return response
      return new Response('Asset not found', { status: 404 })
    }

    try {
      const sessionStorage = createCookieSessionStorage({
        cookie: {
          name: '_session',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secrets: env.SESSION_SECRETS.split(','),
        },
      })
      const loadContext: AppLoadContext = {
        env,
        sessionStorage,
      }
      const response = await remixRequestHandler(request, loadContext)
      return response
    } catch (error) {
      console.error(error)
      return new Response('An unexpected error occurred.', {
        status: 500,
      })
    }
  },
}

function isAsset(pathname: string): boolean {
  return (
    pathname.startsWith(assetPath) ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/browserconfig.xml')
  )
}
