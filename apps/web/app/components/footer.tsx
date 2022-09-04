import { EnvelopeIcon } from '@heroicons/react/24/outline'

export function Footer() {
  return (
    <footer className="mt-8 mb-16 border-t pt-4 dark:border-zinc-800">
      <a
        href="mailto:contact@supachai.dev"
        className="flex w-fit items-center font-medium text-zinc-700 underline hover:text-zinc-500 dark:text-zinc-400 dark:hover:text-zinc-600"
      >
        <EnvelopeIcon className="mr-2 h-6 w-6" />
        Send an email to me
      </a>
    </footer>
  )
}
