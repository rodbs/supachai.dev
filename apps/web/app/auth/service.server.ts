import type { Authenticator } from 'remix-auth'
import type { User } from '~/user'

interface AuthService {
  authenticator: Authenticator<User>
  isAdmin(): Promise<boolean>
}
