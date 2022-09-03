import type { ActionArgs } from '@remix-run/cloudflare'
import { redirect } from '@remix-run/cloudflare'
import { getAuthService } from '~/auth'

export async function action({ context, request }: ActionArgs) {
  const authService = await getAuthService({
    context,
    request,
  })

  return authService.authenticator.authenticate('github', request)
}

export function loader() {
  return redirect('/')
}
