import type { LoaderArgs } from '@remix-run/cloudflare'
import { json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { getAuthService } from '~/auth'
import { Container } from '~/components/container'
import { Footer } from '~/components/footer'
import NavBar from '~/components/navbar'

export async function loader({ context, request }: LoaderArgs) {
  const authService = await getAuthService({ context, request })
  const isAuthenticated = Boolean(
    await authService.authenticator.isAuthenticated(request),
  )

  return json({ isAuthenticated })
}

export default function AboutRoute() {
  const { isAuthenticated } = useLoaderData<typeof loader>()

  return (
    <>
      <Container>
        <header>
          <NavBar isAuthenticated={isAuthenticated} />
        </header>
        <main className="mt-24 sm:mt-28">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-200">
            About this Website
          </h1>
          <p className="mt-4 sm:mt-8">
            This website is built with <strong>Remix</strong> and{' '}
            <strong>Cloudflare Workers</strong>.
          </p>
          <h2 className="mt-8 text-xl font-bold text-zinc-900 dark:text-zinc-200 sm:mt-16">
            User Data
          </h2>
          <p className="mt-4">
            The only data this website collects is each user's set of starred
            atomic notes.
            <br />
            It is stored in the user's{' '}
            <strong>Cloudflare Workers Durable Object</strong> which is secured.
          </p>
        </main>
        <Footer />
      </Container>
    </>
  )
}
