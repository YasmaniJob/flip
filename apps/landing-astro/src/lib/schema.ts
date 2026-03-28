import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const changelog = sqliteTable('changelog', {
  id: text('id').primaryKey(),
  version: text('version').notNull().unique(),
  title: text('title').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  improvements: text('improvements', { mode: 'json' }).$type<string[]>(),
  fixes: text('fixes', { mode: 'json' }).$type<string[]>(),
  published: integer('published', { mode: 'boolean' }).default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
