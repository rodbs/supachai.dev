import type { AtomicNote } from './model.server'

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
