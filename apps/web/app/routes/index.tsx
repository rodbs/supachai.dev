import { EnvelopeIcon } from '@heroicons/react/24/outline'
import { Container } from '~/components/container'
import NavBar from '~/components/navbar'

interface TechStack {
  name: string
  iconSrc?: string
  href?: string
}

const techStack: Array<TechStack> = [
  {
    name: 'TypeScript',
    iconSrc: '/assets/static/icons/typescript.svg',
    href: 'https://www.typescriptlang.org',
  },
  {
    name: 'React',
    iconSrc: '/assets/static/icons/react.svg',
    href: 'https://reactjs.org',
  },
  {
    name: 'Tailwind CSS',
    iconSrc: '/assets/static/icons/tailwindcss.svg',
    href: 'https://tailwindcss.com',
  },
  {
    name: 'Remix',
    iconSrc: '/assets/static/icons/remix.svg',
    href: 'https://remix.run',
  },
  {
    name: 'Next.js',
    iconSrc: '/assets/static/icons/nextdotjs.svg',
    href: 'https://nextjs.org',
  },
  {
    name: 'Firebase',
    iconSrc: '/assets/static/icons/firebase.svg',
    href: 'https://firebase.google.com',
  },
  {
    name: 'Cloudflare Workers',
    iconSrc: '/assets/static/icons/cloudflare-workers.svg',
    href: 'https://workers.cloudflare.com',
  },
]

export default function Index() {
  return (
    <>
      <Container>
        <header>
          <NavBar />
        </header>
        <main className="mt-24">
          <section className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
            <h1 className="text-2xl font-bold">Fullstack Web Developer</h1>
            <p className="mt-4">
              I build web applications with great UX using progressive
              enhancement philosophy—this website works well without JavaScript.
            </p>
          </section>
          <section className="mt-8">
            <h2 className="text-xl font-bold">Tech Stack</h2>
            <ul className="mt-6 space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
              {techStack.map(({ name, iconSrc, href }) => (
                <li key={name}>
                  <a
                    href={href ? href : '#'}
                    target="_blank"
                    rel="noreferrer"
                    title={name}
                    className="flex w-fit items-center font-bold text-zinc-800 underline hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-700"
                  >
                    {iconSrc ? (
                      <img
                        className="mr-2 h-5 w-5 opacity-40 dark:text-zinc-400"
                        src={iconSrc}
                        alt={name}
                      />
                    ) : null}
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </main>
        <footer className="mt-8 mb-16 border-t pt-4 dark:border-zinc-800">
          <a
            href="mailto:contact@supachai.dev"
            className="flex w-fit items-center text-zinc-700 underline hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-700"
          >
            <EnvelopeIcon className="mr-2 h-6 w-6" />
            Send an email to me
          </a>
        </footer>
      </Container>
    </>
  )
}
