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
  return [
    { rel: 'stylesheet', href: tailwindCssHref },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      href: '/assets/favicons/apple-touch-icon.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      href: '/assets/favicons/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      href: '/assets/favicons/favicon-16x16.png',
    },
    {
      rel: 'manifest',
      href: '/site.webmanifest',
    },
    {
      rel: 'mask-icon',
      href: '/assets/favicons/safari-pinned-tab.svg',
      color: '#000000',
    },
    {
      rel: 'preload',
      as: 'font',
      type: 'font/woff2',
      href: '/assets/static/fonts/inter-v7-latin-regular.woff2',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'preload',
      as: 'font',
      type: 'font/woff2',
      href: '/assets/static/fonts/inter-v7-latin-700.woff2',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'preload',
      as: 'font',
      type: 'font/woff2',
      href: '/assets/static/fonts/inter-v7-latin-500.woff2',
      crossOrigin: 'anonymous',
    },
  ]
}

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Supachai Dev',
  description: 'Fullstack Web Developer',
  viewport: 'width=device-width,initial-scale=1',
  'theme-color-light': {
    name: 'theme-color',
    content: '#fafafa',
    media: '(prefers-color-scheme: light)',
  },
  'theme-color-dark': {
    name: 'theme-color',
    content: '#18181b',
    media: '(prefers-color-scheme: dark)',
  },
})

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="bg-zinc-50 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        {/* <LiveReload /> */}
      </body>
    </html>
  )
}
