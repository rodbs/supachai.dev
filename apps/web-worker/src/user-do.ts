export class UserDurableObject {
  private starredAtomicNoteIds: Set<string> = new Set()

  constructor(private state: DurableObjectState, env: Env) {
    this.state.blockConcurrencyWhile(async () => {
      const storedStarredAtomicNoteId = await this.state.storage.get<
        Set<string>
      >('starredAtomicNotes')
      this.starredAtomicNoteIds = storedStarredAtomicNoteId ?? new Set()
    })
  }

  async fetch(request: Request) {
    const url = new URL(request.url)
    const path = url.pathname.split('/').slice(1)

    if (path[0] === 'starred') {
      if (request.method === 'GET') {
        return new Response(JSON.stringify([...this.starredAtomicNoteIds]))
      }

      if (request.method === 'POST') {
        const body = (await request.json()) as { id: string }
        this.starredAtomicNoteIds.add(body.id)
        await this.state.storage.put(
          'starredAtomicNotes',
          this.starredAtomicNoteIds,
        )
        return new Response(JSON.stringify([...this.starredAtomicNoteIds]))
      }

      if (request.method === 'DELETE') {
        const body = (await request.json()) as { id: string }
        this.starredAtomicNoteIds.delete(body.id)
        await this.state.storage.put(
          'starredAtomicNotes',
          this.starredAtomicNoteIds,
        )
        return new Response(JSON.stringify([...this.starredAtomicNoteIds]))
      }
    }

    return new Response('Not Found', { status: 404 })
  }
}
