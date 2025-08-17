import { Kysely } from 'kysely'
import { D1Dialect } from 'kysely-d1'
import type { SongsTable } from './schema'

interface Database {
  songs: SongsTable
}

export const createDb = (d1: D1Database) => {
  return new Kysely<Database>({
    dialect: new D1Dialect({ database: d1 }),
  })
}
