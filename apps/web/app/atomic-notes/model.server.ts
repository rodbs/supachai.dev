export interface AtomicNote {
  id: string
  body: string
  dateCreated: string
  status: 'published' | 'draft' | 'deleted'
  starredBy: Array<string>
}
