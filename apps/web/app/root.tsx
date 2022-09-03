import type { LinksFunction, MetaFunction } from '@remix-run/cloudflare'
import {
  Links,
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
  title: 'Supachai Dev',
  description: 'Fullstack Web Developer',
  viewport: 'width=device-width,initial-scale=1',
})

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        {/* <LiveReload /> */}
      </body>
    </html>
  )
}
