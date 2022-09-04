interface UserService {
  getStarredAtomicNoteIds(): Promise<string[]>
  starAtomicNote(noteId: string): Promise<void>
  unstarAtomicNote(noteId: string): Promise<void>
}

export function getUserService({
  userId,
  userDo,
}: {
  userId: string
  userDo: DurableObjectNamespace
}): UserService {
  const id = userDo.idFromName(userId)
  const durableObject = userDo.get(id)

  return {
    async getStarredAtomicNoteIds() {
      const response = await durableObject.fetch('https://.../starred')
      const starredAtomicNoteIds = (await response.json()) as string[]
      return starredAtomicNoteIds
    },
    async starAtomicNote(noteId: string) {
      await durableObject.fetch('https://.../starred', {
        method: 'POST',
        body: JSON.stringify({ id: noteId }),
      })
    },
    async unstarAtomicNote(noteId: string) {
      await durableObject.fetch('https://.../starred', {
        method: 'DELETE',
        body: JSON.stringify({ id: noteId }),
      })
    },
  }
}
