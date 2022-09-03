import type { ActionArgs, LoaderArgs } from '@remix-run/cloudflare'
import { getAuthService } from '~/auth'
import { safeRedirect } from '~/auth/utils.server'

export async function action({ context, request }: ActionArgs) {
  const authService = await getAuthService({ context, request })
  const searchParams = new URL(request.url).searchParams
  const redirectTo = safeRedirect(searchParams.get('redirect'))

  return await authService.authenticator.logout(request, {
    redirectTo,
  })
}

export async function loader({ context, request }: LoaderArgs) {
  const searchParams = new URL(request.url).searchParams
  const authService = await getAuthService({ context, request })

  return await authService.authenticator.logout(request, {
    redirectTo: safeRedirect(searchParams.get('redirect')),
  })
}
