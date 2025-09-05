 import { drizzle } from 'drizzle-orm/d1'
 import { schema } from './schema'

 export const createDb = (d1: D1Database) => {
   return drizzle(d1, { schema })
 }
