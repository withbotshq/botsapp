import Database from 'better-sqlite3'
import {drizzle} from 'drizzle-orm/better-sqlite3'
import {migrate} from 'drizzle-orm/better-sqlite3/migrator'
import {app} from 'electron'
import path from 'path'
import {Message, messages} from './schema'

const dbPath = path.join(app.getPath('userData'), 'data.db')
const nativeBindingPath = path.join(
  app.getAppPath(),
  'node_modules/better-sqlite3/build/Release/better_sqlite3'
)

const sqlite = new Database(dbPath, {
  verbose: console.log,
  nativeBinding: nativeBindingPath
})

const db = drizzle(sqlite)

export function runMigrations() {
  migrate(db, {migrationsFolder: path.join(app.getAppPath(), 'migrations')})
}

export function listMessages(): Message[] {
  return db.select().from(messages).all()
}
