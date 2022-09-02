import type { LinksFunction, MetaFunction } from '@remix-run/cloudflare'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react'
import tailwindCssHref from '~/styles/tailwind.css'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: tailwindCssHref }]
}

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'New Remix App',
  viewport: 'width=device-width,initial-scale=1',
})

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="dark:bg-zinc-900">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
