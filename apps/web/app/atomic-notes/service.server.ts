import type { AtomicNote } from './model.server'

const PREFIX = 'atomic-note:'

interface AtomicNotesService {
  create(note: AtomicNote): Promise<AtomicNote>
  update(id: string, note: Partial<AtomicNote>): Promise<void>
  delete(id: string): Promise<void>
  getAll(): Promise<Array<AtomicNote>>
  star(userId: string, noteId: string): Promise<void>
  unstar(userId: string, noteId: string): Promise<void>
  isStarred(userId: string, noteId: string): Promise<boolean>
  getStarred(userId: string): Promise<Array<AtomicNote>>
}

export function getAtomicNoteService(kv: KVNamespace): AtomicNotesService {
  return {
    async create(note: AtomicNote) {
      try {
        await kv.put(`${PREFIX}${note.id}`, JSON.stringify(note), {
          metadata: note,
        })

        return note
      } catch (error) {
        console.error('🚨 Failed to get create an atomic note:', error)
        throw new Error('Failed to create an atomic note')
      }
    },
    async update(id: string, note: Partial<AtomicNote>) {
      try {
        const existing = (await kv.get(`${PREFIX}${id}`, 'json')) as AtomicNote
        if (!existing) throw new Error('Atomic note not found')

        const updatedNote = {
          ...existing,
          ...note,
        }
        await kv.put(`${PREFIX}${id}`, JSON.stringify(updatedNote), {
          metadata: updatedNote,
        })
      } catch (error) {
        console.error('🚨 Failed to update an atomic note:', error)
        throw new Error('Failed to update an atomic note')
      }
    },
    async delete(id: string) {
      try {
        await kv.delete(`${PREFIX}${id}`)
      } catch (error) {
        console.error('🚨 Failed to delete an atomic note:', error)
        throw new Error('Failed to delete an atomic note')
      }
    },
    async getAll() {
      try {
        const values = await kv.list({ prefix: PREFIX })
        if (values.list_complete)
          return values.keys.map(({ metadata }) => metadata as AtomicNote)

        let keys = [...values.keys]
        let cursor = values.cursor
        while (true) {
          const values = await kv.list({ cursor, prefix: PREFIX })
          keys = [...keys, ...values.keys]
          if (values.list_complete) break
          cursor = values.cursor
        }
        return keys.map(({ metadata }) => metadata as AtomicNote)
      } catch (error) {
        console.error('🚨 Failed to get all atomic notes:', error)
        throw new Error('Failed to get all atomic notes')
      }
    },
    async star(userId: string, noteId: string) {
      try {
        const existing = (await kv.get(
          `${PREFIX}${noteId}`,
          'json',
        )) as AtomicNote
        if (!existing) throw new Error('Atomic note not found')

        const updatedNote = {
          ...existing,
          starredBy: [...existing.starredBy, userId],
        }
        await kv.put(`${PREFIX}${noteId}`, JSON.stringify(updatedNote), {
          metadata: updatedNote,
        })
      } catch (error) {
        console.error('🚨 Failed to star an atomic note:', error)
        throw new Error('Failed to star an atomic note')
      }
    },
    async unstar(userId: string, noteId: string) {
      try {
        const existing = (await kv.get(
          `${PREFIX}${noteId}`,
          'json',
        )) as AtomicNote
        if (!existing) throw new Error('Atomic note not found')

        const updatedNote = {
          ...existing,
          starredBy: existing.starredBy.filter(id => id !== userId),
        }
        await kv.put(`${PREFIX}${noteId}`, JSON.stringify(updatedNote), {
          metadata: updatedNote,
        })
      } catch (error) {
        console.error('🚨 Failed to unstar an atomic note:', error)
        throw new Error('Failed to unstar an atomic note')
      }
    },
    async isStarred(userId: string, noteId: string) {
      try {
        const existing = (await kv.get(
          `${PREFIX}${noteId}`,
          'json',
        )) as AtomicNote
        if (!existing) throw new Error('Atomic note not found')

        return existing.starredBy.includes(userId)
      } catch (error) {
        console.error('🚨 Failed to check if atomic note is starred:', error)
        throw new Error('Failed to check if atomic note is starred')
      }
    },
    async getStarred(userId: string) {
      try {
        const values = await kv.list({ prefix: PREFIX })
        if (values.list_complete)
          return values.keys
            .map(({ metadata }) => metadata as AtomicNote)
            .filter(note => note.starredBy.includes(userId))

        let keys = [...values.keys]
        let cursor = values.cursor
        while (true) {
          const values = await kv.list({ cursor, prefix: PREFIX })
          keys = [...keys, ...values.keys]
          if (values.list_complete) break
          cursor = values.cursor
        }
        return keys
          .map(({ metadata }) => metadata as AtomicNote)
          .filter(note => note.starredBy.includes(userId))
      } catch (error) {
        console.error('🚨 Failed to get starred atomic notes:', error)
        throw new Error('Failed to get starred atomic notes')
      }
    },
  }
}
