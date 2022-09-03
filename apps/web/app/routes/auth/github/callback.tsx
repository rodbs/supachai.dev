import type { LoaderArgs } from '@remix-run/cloudflare'
import { getAuthService } from '~/auth'
import { safeRedirect } from '~/auth/utils.server'

export async function loader({ context, request }: LoaderArgs) {
  const authService = await getAuthService({
    context,
    request,
  })
  const searchParams = new URL(request.url).searchParams
  const redirectTo = safeRedirect(searchParams.get('redirect'))

  return authService.authenticator.authenticate('github', request, {
    successRedirect: redirectTo,
    failureRedirect: redirectTo,
  })
}
