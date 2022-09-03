import type { AppLoadContext } from '@remix-run/cloudflare'
import { Authenticator } from 'remix-auth'
import { GitHubStrategy } from 'remix-auth-github'
import type { User } from '~/user'
import { safeRedirect } from './utils.server'

interface AuthService {
  authenticator: Authenticator<User>
  isAdmin(): Promise<boolean>
}

export async function getAuthService({
  context,
  request,
}: {
  context: AppLoadContext
  request: Request
  redirectTo?: string
}): Promise<AuthService> {
  return {
    authenticator: await getGitHubAuthenticator({ context, request }),
    isAdmin: async () => isAdmin({ context, request }),
  }
}

async function isAdmin({
  context,
  request,
}: {
  context: AppLoadContext
  request: Request
}): Promise<boolean> {
  const authenticator = await getGitHubAuthenticator({ context, request })
  const user = await authenticator.isAuthenticated(request)

  if (!user) return false

  if (user.id === context.env.GITHUB_ADMIN_ID) return true

  return false
}

async function getGitHubAuthenticator({
  context,
  request,
}: {
  context: AppLoadContext
  request: Request
}) {
  const authenticator = new Authenticator<User>(context.sessionStorage)
  const gitHubStrategy = await getGitHubStrategy({ context, request })
  authenticator.use(gitHubStrategy)

  return authenticator
}

async function getGitHubStrategy({
  context,
  request,
}: {
  context: AppLoadContext
  request: Request
}) {
  const searchParams = new URL(request.url).searchParams
  const redirect = safeRedirect(searchParams.get('redirect'))

  return new GitHubStrategy<User>(
    {
      clientID: context.env.GITHUB_CLIENT_ID,
      clientSecret: context.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${context.env.GITHUB_CALLBACK_URL}?${new URLSearchParams({
        redirect,
      })}`,
    },
    async ({ profile }) => {
      return { id: profile.id, profilePictureURL: profile.photos[0].value }
    },
  )
}
