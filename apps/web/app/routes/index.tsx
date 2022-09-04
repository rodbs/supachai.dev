import { useAutoAnimate } from '@formkit/auto-animate/react'
import {
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import type { ActionArgs, LoaderArgs } from '@remix-run/cloudflare'
import { json, redirect } from '@remix-run/cloudflare'
import {
  Form,
  Link,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams,
  useTransition,
} from '@remix-run/react'
import type { FunctionComponent } from 'react'
import { useEffect, useRef, useState } from 'react'
import invariant from 'tiny-invariant'
import type { AtomicNote } from '~/atomic-notes'
import { getAtomicNoteService } from '~/atomic-notes'
import { getAuthService } from '~/auth'
import { Container } from '~/components/container'
import NavBar from '~/components/navbar'
import {
  CloudflareWorkers,
  FirebaseIcon,
  GitHubIcon,
  NextDotJSIcon,
  ReactIcon,
  RemixIcon,
  TailwindCSSIcon,
  TypeScriptIcon,
} from '~/components/tech-icons'
import { getUserService } from '~/user'

const ATOMIC_NOTES_PER_PAGE = 3
const LOAD_MORE_COUNT = 3

const ATOMIC_NOTE_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  TOGGLE_VISIBILITY: 'TOGGLE_VISIBILITY',
  SEARCH: 'SEARCH',
  TOGGLE_STAR: 'TOGGLE_STAR',
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

    const urlSearchParamsString = formData.get('urlSearchParams')
    if (!urlSearchParamsString) return redirect(`/#${atomicNoteId}`)
    invariant(
      typeof urlSearchParamsString === 'string',
      'urlSearchParams must be a string',
    )
    const urlSearchParams = new URLSearchParams(urlSearchParamsString)

    return redirect(
      `/?${new URLSearchParams([
        ['atomicNoteId', ''],
        ['edit', 'false'],
        ...urlSearchParams.entries(),
      ])}#${atomicNoteId}`,
    )
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

  if (action === ATOMIC_NOTE_ACTIONS.TOGGLE_STAR) {
    const authService = await getAuthService({ context, request })
    const user = await authService.authenticator.isAuthenticated(request)
    if (!user) throw new Response('Unauthorized', { status: 401 })

    const atomicNoteId = formData.get('atomicNoteId')
    invariant(
      typeof atomicNoteId === 'string',
      'atomic note id must be a string',
    )
    const value = formData.get('value')
    invariant(typeof value === 'string', 'value must be a string')

    const userService = getUserService({
      userId: user.id,
      userDo: context.env.DO_USER,
    })

    if (value === '1') await userService.starAtomicNote(atomicNoteId)
    else await userService.unstarAtomicNote(atomicNoteId)

    return json({})
  }

  throw new Error('Invalid action')
}

export async function loader({ context, request }: LoaderArgs) {
  const authService = await getAuthService({ context, request })
  const user = await authService.authenticator.isAuthenticated(request)
  const isAuthenticated = Boolean(user)
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
  const userService = user
    ? getUserService({ userId: user?.id, userDo: context.env.DO_USER })
    : null
  const starredAtomicNoteIds =
    (await userService?.getStarredAtomicNoteIds()) ?? []

  const atomicNotes = (await atomicNoteService.getAll())
    .filter(atomicNote => {
      if (atomicNote.status === 'draft') return isAdmin
      return true
    })
    .filter(atomicNote => {
      if (url.searchParams.has('starred')) {
        if (!user) return false
        return starredAtomicNoteIds.includes(atomicNote.id)
      }
      return true
    })
    .filter(atomicNote => {
      const allSearchTerms = url.searchParams.getAll('atomicNoteSearchQuery')
      const search = allSearchTerms[allSearchTerms.length - 1]
      if (!search) return true
      return atomicNote.body.toLowerCase().includes(search.toLowerCase())
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

  const data = {
    atomicNotes: slicedAtomicNotes,
    hasMoreAtomicNotes,
    isAuthenticated,
    isAdmin,
    atomicNoteSearchQuery: url.searchParams.get('atomicNoteSearchQuery') ?? '',
    starredAtomicNoteIds,
  }

  return json(data)
}

interface TechStack {
  name: string
  href?: string
  IconComponent?: FunctionComponent<{ classNames: string }>
}

const techStack: Array<TechStack> = [
  {
    name: 'TypeScript',
    href: 'https://www.typescriptlang.org',
    IconComponent: TypeScriptIcon,
  },
  {
    name: 'React',
    href: 'https://reactjs.org',
    IconComponent: ReactIcon,
  },
  {
    name: 'Tailwind CSS',
    href: 'https://tailwindcss.com',
    IconComponent: TailwindCSSIcon,
  },
  {
    name: 'Remix',
    href: 'https://remix.run',
    IconComponent: RemixIcon,
  },
  {
    name: 'Next.js',
    href: 'https://nextjs.org',
    IconComponent: NextDotJSIcon,
  },
  {
    name: 'Firebase',
    href: 'https://firebase.google.com',
    IconComponent: FirebaseIcon,
  },
  {
    name: 'Cloudflare Workers',
    href: 'https://workers.cloudflare.com',
    IconComponent: CloudflareWorkers,
  },
]

export default function Index() {
  const {
    atomicNotes: _atomicNotes,
    starredAtomicNoteIds,
    hasMoreAtomicNotes: _hasMoreAtomicNotes,
    isAuthenticated,
    isAdmin,
    atomicNoteSearchQuery: _atomicNoteSearchQuery,
  } = useLoaderData<typeof loader>()
  const [atomicNotes, setAtomicNotes] = useState(_atomicNotes)
  const [atomicNoteSearchQuery, setAtomicNoteSearchQuery] = useState(
    _atomicNoteSearchQuery,
  )
  const [hasMoreAtomicNotes, setHasMoreAtomicNotes] =
    useState(_hasMoreAtomicNotes)
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
  const searchFormRef = useRef<HTMLFormElement>(null)
  const isSearchingAtomicNotes =
    atomicNoteFetcher.state === 'submitting' &&
    atomicNoteFetcher.submission.formData.get('_action') ===
      ATOMIC_NOTE_ACTIONS.SEARCH
  const transition = useTransition()
  const [atomicNoteParent] = useAutoAnimate<HTMLUListElement>()
  const navigate = useNavigate()

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }

    if (isCreatingAtomicNote) return
    if (isSearchingAtomicNotes) {
      if (!atomicNoteFetcher.submission?.formData.get('atomicNoteSearchQuery'))
        navigate('/#atomic-note-list', { replace: true })
      return
    }

    createNoteFormRef.current?.reset()
    setAtomicNoteSearchQuery(atomicNoteFetcher.data?.atomicNoteSearchQuery)
    setAtomicNotes(atomicNoteFetcher.data?.atomicNotes)
    setHasMoreAtomicNotes(atomicNoteFetcher.data?.hasMoreAtomicNotes)

    document
      .querySelector('#atomic-note-list')
      ?.scrollIntoView({ behavior: 'smooth' })
  }, [
    atomicNoteFetcher.data?.atomicNoteSearchQuery,
    atomicNoteFetcher.data?.atomicNotes,
    atomicNoteFetcher.data?.hasMoreAtomicNotes,
    atomicNoteFetcher.submission?.formData,
    isCreatingAtomicNote,
    isSearchingAtomicNotes,
    navigate,
  ])

  useEffect(() => {
    if (transition.state === 'submitting') return
    setAtomicNotes(_atomicNotes)
    setAtomicNoteSearchQuery(_atomicNoteSearchQuery)
    setHasMoreAtomicNotes(_hasMoreAtomicNotes)
    searchFormRef.current?.reset()
  }, [
    transition.state,
    _atomicNotes,
    _atomicNoteSearchQuery,
    _hasMoreAtomicNotes,
  ])

  return (
    <>
      <Container>
        <header>
          <NavBar isAuthenticated={isAuthenticated} />
        </header>
        <main className="mt-24 sm:mt-28">
          <section className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-200">
              Fullstack Web Developer
            </h1>
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
              className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-zinc-800 shadow-sm hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-transparent dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-transparent dark:focus:ring-offset-0"
            >
              <GitHubIcon classNames="w-5 h-5 mr-2" />
              My GitHub Profile
            </a>
          </section>
          <section className="mt-8 sm:mt-12">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-200">
              Tech Stack
            </h2>
            <ul className="mt-6 space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
              {techStack.map(({ name, IconComponent, href }) => (
                <li key={name}>
                  <a
                    href={href ? href : '#'}
                    target="_blank"
                    rel="noreferrer"
                    title={name}
                    className="flex w-fit items-center font-medium underline hover:text-zinc-600 dark:hover:text-zinc-500"
                  >
                    {IconComponent ? (
                      <IconComponent classNames="h-5 w-5 mr-2" />
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
            <div className="mt-4">
              <Link
                prefetch="intent"
                to={
                  urlSearchParams.has('starred')
                    ? '/#atomic-note-list'
                    : '/?starred#atomic-note-list'
                }
                className="flex items-center text-zinc-700 underline hover:text-zinc-500 dark:text-zinc-400 dark:hover:text-zinc-600"
              >
                {urlSearchParams.has('starred') ? (
                  <StarIconSolid className="mr-2 inline-block h-5 w-5" />
                ) : (
                  <StarIcon className="mr-2 inline-block h-5 w-5" />
                )}
                Show {urlSearchParams.has('starred') ? 'all' : 'starred'} notes
              </Link>
            </div>
            {!isAuthenticated && (
              <div className="mt-4">
                <p>Log in to star atomic notes.</p>
              </div>
            )}
            <atomicNoteFetcher.Form
              replace
              method="get"
              ref={searchFormRef}
              className="mt-3"
            >
              <input
                type="hidden"
                name="_action"
                value={ATOMIC_NOTE_ACTIONS.SEARCH}
              />
              <div className="relative flex items-center">
                <label htmlFor="atomic-note-search-query" className="sr-only">
                  Search
                </label>
                <div className="flex w-full items-center border-b dark:border-zinc-700">
                  <MagnifyingGlassIcon
                    aria-label="Magnifying glass icon"
                    className="h-5 w-5 text-zinc-400"
                  />
                  <input
                    type="search"
                    autoComplete="off"
                    name="atomicNoteSearchQuery"
                    id="atomic-note-search-query"
                    placeholder="Search"
                    className="ml-2 w-full bg-transparent py-2 placeholder:text-zinc-400 focus:outline-none dark:placeholder:text-zinc-600"
                    defaultValue={atomicNoteSearchQuery}
                  />
                </div>
                <div className="ml-2 flex">
                  <button className="inline-flex items-center rounded border border-zinc-300 px-3 py-1 font-sans text-sm font-medium text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
                    Search
                  </button>
                </div>
              </div>
            </atomicNoteFetcher.Form>
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
                    className="w-full rounded-none border-b bg-transparent py-2 placeholder:text-zinc-400 focus:outline-none dark:border-zinc-700 dark:placeholder:text-zinc-600"
                  />
                  <button
                    name="_action"
                    value={ATOMIC_NOTE_ACTIONS.CREATE}
                    disabled={isCreatingAtomicNote}
                  >
                    <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                      <kbd className="inline-flex items-center rounded border border-zinc-300 px-3 font-sans text-sm font-medium text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
                        ⏎
                      </kbd>
                    </div>
                  </button>
                </div>
              </atomicNoteFetcher.Form>
            )}
            {atomicNotes?.length === 0 ? (
              <p id="no-atomic-notes-prompt" className="mt-4">
                {!isAuthenticated
                  ? 'Log in to see your starred atomic notes'
                  : urlSearchParams.has('starred')
                  ? 'No starred atomic notes'
                  : 'No published atomic notes'}
              </p>
            ) : (
              <div>
                <ul id="atomic-note-list" ref={atomicNoteParent}>
                  {atomicNotes?.map(atomicNote => (
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
                            type="hidden"
                            name="urlSearchParams"
                            value={urlSearchParams.toString()}
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
                            to={`?${new URLSearchParams([
                              ['atomicNoteId', ''],
                              ['edit', 'false'],
                              ...urlSearchParams.entries(),
                            ])}#${atomicNote.id}`}
                            prefetch="intent"
                            className="ml-4 underline hover:text-zinc-600 dark:hover:text-zinc-500"
                          >
                            cancel
                          </Link>
                        </atomicNoteFetcher.Form>
                      ) : (
                        <AtomicNoteItem note={atomicNote} />
                      )}

                      {isAuthenticated && (
                        <div className="ml-4">
                          <Form method="post" className="flex items-center">
                            <input
                              type="hidden"
                              name="_action"
                              value={ATOMIC_NOTE_ACTIONS.TOGGLE_STAR}
                            />
                            <input
                              type="hidden"
                              name="atomicNoteId"
                              value={atomicNote.id}
                            />
                            <input
                              type="hidden"
                              name="value"
                              value={
                                starredAtomicNoteIds.includes(atomicNote.id)
                                  ? 0
                                  : 1
                              }
                            />
                            {starredAtomicNoteIds.includes(atomicNote.id) ? (
                              <button aria-label="unstar note">
                                <StarIconSolid className="h-5 w-5 text-zinc-400 dark:text-zinc-700" />
                              </button>
                            ) : (
                              <button aria-label="star note">
                                <StarIcon className="h-5 w-5 text-zinc-400 dark:text-zinc-700" />
                              </button>
                            )}
                          </Form>
                        </div>
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
                              ])}#${atomicNote.id}`}
                              prefetch="intent"
                              aria-label="edit note"
                            >
                              <PencilSquareIcon
                                aria-label="Pencil Square Icon"
                                className="ml-4 h-5 w-5"
                              />
                            </Link>
                            <Form method="post" className="ml-4 flex">
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
                            </Form>
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
                      ['atomicNoteSearchQuery', atomicNoteSearchQuery],
                    ])}#${atomicNotes[atomicNotes.length - 1].id}`}
                    className="mt-4 flex w-fit underline hover:text-zinc-600 dark:hover:text-zinc-500"
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
            className="flex w-fit items-center font-medium text-zinc-700 underline hover:text-zinc-500 dark:text-zinc-400 dark:hover:text-zinc-600"
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
