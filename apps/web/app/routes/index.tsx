import {
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import type { ActionArgs, LoaderArgs } from '@remix-run/cloudflare'
import { json, redirect } from '@remix-run/cloudflare'
import {
  Link,
  useFetcher,
  useLoaderData,
  useLocation,
  useSearchParams,
} from '@remix-run/react'
import { useEffect, useRef } from 'react'
import invariant from 'tiny-invariant'
import type { AtomicNote } from '~/atomic-notes'
import { getAtomicNoteService } from '~/atomic-notes'
import { getAuthService } from '~/auth'
import { Container } from '~/components/container'
import NavBar from '~/components/navbar'

const ATOMIC_NOTES_PER_PAGE = 3
const LOAD_MORE_COUNT = 3

const ATOMIC_NOTE_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  TOGGLE_VISIBILITY: 'TOGGLE_VISIBILITY',
} as const

export async function action({ context, request }: ActionArgs) {
  const formData = await request.formData()
  const action = formData.get('_action')

  if (action === ATOMIC_NOTE_ACTIONS.CREATE) {
    const authService = await getAuthService({ context, request })
    if (!(await authService.isAdmin()))
      throw new Response('Unauthorized', { status: 401 })

    const atomicNoteService = getAtomicNoteService(context.env.KV_ATOMIC_NOTES)
    const atomicNoteBody = formData.get('atomicNoteBody')
    invariant(
      typeof atomicNoteBody === 'string',
      'atomic note body must be a string',
    )
    const atomicNote: AtomicNote = {
      id: crypto.randomUUID(),
      body: atomicNoteBody,
      dateCreated: new Date().toISOString(),
      starredBy: [],
      status: 'draft',
    }
    return json({ atomicNote: await atomicNoteService.create(atomicNote) })
  }

  if (action === ATOMIC_NOTE_ACTIONS.UPDATE) {
    const authService = await getAuthService({ context, request })
    if (!(await authService.isAdmin()))
      throw new Response('Unauthorized', { status: 401 })

    const atomicNoteId = formData.get('atomicNoteId')
    invariant(
      typeof atomicNoteId === 'string',
      'atomic note id must be a string',
    )
    const atomicNoteBody = formData.get('atomicNoteBody')
    invariant(
      typeof atomicNoteBody === 'string',
      'atomic note body must be a string',
    )
    const atomicNoteService = getAtomicNoteService(context.env.KV_ATOMIC_NOTES)
    await atomicNoteService.update(atomicNoteId, { body: atomicNoteBody })
    return redirect('/')
  }

  if (action === ATOMIC_NOTE_ACTIONS.TOGGLE_VISIBILITY) {
    const authService = await getAuthService({ context, request })
    if (!(await authService.isAdmin()))
      throw new Response('Unauthorized', { status: 401 })

    const atomicNoteId = formData.get('atomicNoteId')
    invariant(
      typeof atomicNoteId === 'string',
      'atomic note id must be a string',
    )
    const status = formData.get('status')
    invariant(
      status === 'published' || status === 'draft' || status === 'deleted',
      'status is invalid',
    )

    const atomicNoteService = getAtomicNoteService(context.env.KV_ATOMIC_NOTES)
    await atomicNoteService.update(atomicNoteId, { status })

    return json({})
  }

  throw new Error('Invalid action')
}

export async function loader({ context, request }: LoaderArgs) {
  const authService = await getAuthService({ context, request })
  const isAuthenticated = Boolean(
    await authService.authenticator.isAuthenticated(request),
  )
  const isAdmin = await authService.isAdmin()

  const url = new URL(request.url)
  const atomicNoteOffsetParam = url.searchParams.get('atomicNoteOffset')
  invariant(
    !atomicNoteOffsetParam || typeof atomicNoteOffsetParam === 'string',
    'atomic note offset must be a string',
  )
  const atomicNoteOffsetMaybeInt = atomicNoteOffsetParam
    ? parseInt(atomicNoteOffsetParam)
    : 0
  const atomicNoteOffset =
    typeof atomicNoteOffsetMaybeInt === 'number' ? atomicNoteOffsetMaybeInt : 0

  const atomicNoteService = getAtomicNoteService(context.env.KV_ATOMIC_NOTES)
  const atomicNotes = (await atomicNoteService.getAll())
    .filter(atomicNote => {
      if (atomicNote.status === 'draft') return isAdmin
      return true
    })
    .sort(
      (a, b) =>
        new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime(),
    )

  const slicedAtomicNotes = atomicNotes.slice(
    0,
    ATOMIC_NOTES_PER_PAGE + atomicNoteOffset,
  )
  const hasMoreAtomicNotes = atomicNotes.length > slicedAtomicNotes.length

  return json({
    atomicNotes: slicedAtomicNotes,
    hasMoreAtomicNotes,
    isAuthenticated,
    isAdmin,
  })
}

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
  const { atomicNotes, hasMoreAtomicNotes, isAuthenticated, isAdmin } =
    useLoaderData<typeof loader>()
  const atomicNoteFetcher = useFetcher()
  const isCreatingAtomicNote =
    atomicNoteFetcher.state === 'submitting' &&
    atomicNoteFetcher.submission.formData.get('_action') ===
      ATOMIC_NOTE_ACTIONS.CREATE
  const location = useLocation()
  const [urlSearchParams] = useSearchParams()
  const atomicNoteOffset = urlSearchParams.get('atomicNoteOffset') ?? '0'
  const mounted = useRef(false)
  const createNoteFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }

    if (isCreatingAtomicNote) return

    createNoteFormRef.current?.reset()
  }, [isCreatingAtomicNote])

  return (
    <>
      <Container>
        <header>
          <NavBar isAuthenticated={isAuthenticated} />
        </header>
        <main className="mt-24 sm:mt-28">
          <section className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
            <h1 className="text-2xl font-bold">Fullstack Web Developer</h1>
            <p className="mt-4">
              I build web applications with great UX using progressive
              enhancement philosophy—this website works well without JavaScript.
            </p>
          </section>
          <section className="mt-8 sm:mt-12">
            <a
              href="https://github.com/supachaidev"
              target="_blank"
              rel="noreferrer"
              title="My GitHub profile"
              className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-zinc-700 shadow-sm hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:bg-transparent dark:focus:ring-offset-0"
            >
              <img
                className="mr-2 h-5 w-5"
                src="/assets/static/icons/github.svg"
                alt="GitHub Icon"
              />
              My GitHub Profile
            </a>
          </section>
          <section className="mt-8 sm:mt-12">
            <h2 className="text-xl font-bold">Tech Stack</h2>
            <ul className="mt-6 space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
              {techStack.map(({ name, iconSrc, href }) => (
                <li key={name}>
                  <a
                    href={href ? href : '#'}
                    target="_blank"
                    rel="noreferrer"
                    title={name}
                    className="flex w-fit items-center font-medium text-zinc-800 underline hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-700"
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
            <p className="mt-8">
              I can dive into new technologies and self-learn them quickly.
            </p>
          </section>
          <section className="mt-8 sm:mt-12">
            <h2 className="text-xl font-bold">Atomic Notes</h2>
            {isAdmin && (
              <atomicNoteFetcher.Form
                ref={createNoteFormRef}
                replace
                method="post"
                className="mt-3"
              >
                <div className="relative flex items-center">
                  <label htmlFor="atomic-note-body" className="sr-only">
                    Create note...
                  </label>
                  <input
                    required
                    type="text"
                    name="atomicNoteBody"
                    id="atomic-note-body"
                    placeholder="Create note..."
                    className="w-full border-b bg-transparent py-2 placeholder:text-zinc-400 focus:outline-none dark:placeholder:text-zinc-600"
                  />
                  <button
                    name="_action"
                    value={ATOMIC_NOTE_ACTIONS.CREATE}
                    disabled={isCreatingAtomicNote}
                  >
                    <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                      <kbd className="inline-flex items-center rounded border border-zinc-200 px-3 font-sans text-sm font-medium text-zinc-400">
                        ⏎
                      </kbd>
                    </div>
                  </button>
                </div>
              </atomicNoteFetcher.Form>
            )}
            {atomicNotes.length === 0 ? (
              <p className="mt-4">No published atomic notes</p>
            ) : (
              <div>
                <ul>
                  {atomicNotes.map(atomicNote => (
                    <li
                      id={atomicNote.id}
                      key={atomicNote.id}
                      className="mt-4 flex items-center"
                    >
                      {urlSearchParams.get('edit') === 'true' &&
                      urlSearchParams.get('atomicNoteId') === atomicNote.id ? (
                        <atomicNoteFetcher.Form method="post" replace>
                          <input
                            type="hidden"
                            name="atomicNoteId"
                            value={atomicNote.id}
                          />
                          <input
                            required
                            type="text"
                            name="atomicNoteBody"
                            id="atomic-note-body"
                            className="border-b bg-transparent dark:border-zinc-700"
                            defaultValue={atomicNote.body}
                          />
                          <button
                            name="_action"
                            value={ATOMIC_NOTE_ACTIONS.UPDATE}
                            className="ml-4 underline hover:text-zinc-600 dark:hover:text-zinc-500"
                          >
                            update
                          </button>
                          <Link
                            to="."
                            prefetch="intent"
                            className="ml-4 underline hover:text-zinc-600 dark:hover:text-zinc-500"
                          >
                            cancel
                          </Link>
                        </atomicNoteFetcher.Form>
                      ) : (
                        <AtomicNoteItem note={atomicNote} />
                      )}
                      {isAdmin &&
                        urlSearchParams.get('atomicNoteId') !==
                          atomicNote.id && (
                          <div className="flex items-center">
                            <Link
                              to={`${location.pathname}?${new URLSearchParams([
                                ['atomicNoteId', atomicNote.id],
                                ['edit', 'true'],
                                ...urlSearchParams.entries(),
                              ])}`}
                              prefetch="intent"
                            >
                              <PencilSquareIcon
                                aria-label="Pencil Square Icon"
                                className="ml-4 h-5 w-5"
                              />
                            </Link>
                            <atomicNoteFetcher.Form
                              method="post"
                              className="ml-4 flex"
                            >
                              <input
                                type="hidden"
                                name="atomicNoteId"
                                value={atomicNote.id}
                              />
                              <input
                                type="hidden"
                                name="status"
                                value={
                                  atomicNote.status === 'published'
                                    ? 'draft'
                                    : 'published'
                                }
                              />
                              <button
                                aria-label="Toggle status"
                                name="_action"
                                value={ATOMIC_NOTE_ACTIONS.TOGGLE_VISIBILITY}
                              >
                                {atomicNote.status === 'published' ? (
                                  <EyeIcon
                                    aria-label="Eye Icon"
                                    className="h-5 w-5"
                                  />
                                ) : (
                                  <EyeSlashIcon
                                    aria-label="Eye Slash Icon"
                                    className="h-5 w-5"
                                  />
                                )}
                              </button>
                            </atomicNoteFetcher.Form>
                          </div>
                        )}
                    </li>
                  ))}
                </ul>
                {hasMoreAtomicNotes && (
                  <Link
                    to={`/?${new URLSearchParams([
                      [
                        'atomicNoteOffset',
                        (+atomicNoteOffset + LOAD_MORE_COUNT).toString(),
                      ],
                      ...urlSearchParams.entries(),
                    ])}#${atomicNotes[atomicNotes.length - 1].id}`}
                    className="mt-4 flex w-fit underline"
                  >
                    load more
                  </Link>
                )}
              </div>
            )}
          </section>
        </main>
        <footer className="mt-8 mb-16 border-t pt-4 dark:border-zinc-800">
          <a
            href="mailto:contact@supachai.dev"
            className="flex w-fit items-center font-medium text-zinc-700 underline hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-700"
          >
            <EnvelopeIcon className="mr-2 h-6 w-6" />
            Send an email to me
          </a>
        </footer>
      </Container>
    </>
  )
}

function AtomicNoteItem({ note }: { note: AtomicNote }) {
  return (
    <div className="relative flex items-center">
      <span className="absolute inset-y-0 top-1 left-0">•</span>
      <p className="py-1 pl-4">{note.body}</p>
    </div>
  )
}
