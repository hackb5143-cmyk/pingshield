import { sqliteTable, text, real, index, integer } from 'drizzle-orm/sqlite-core';
export const recoveryReports = sqliteTable('recovery_reports', {
  id: text('id').primaryKey(), tagCode: text('tag_code').notNull(), message: text('message').notNull(),
  finderContact: text('finder_contact'), latitude: real('latitude'), longitude: real('longitude'),
  accuracy: real('accuracy'), manualLocation: text('manual_location'), requesterHash: text('requester_hash').notNull(),
  createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
  liveTokenHash: text('live_token_hash'), liveExpiresAt: text('live_expires_at'), sharingStoppedAt: text('sharing_stopped_at'),
}, table => [index('recovery_rate').on(table.requesterHash,table.createdAt),index('recovery_tag').on(table.tagCode,table.createdAt)]);

export const contactThreads = sqliteTable('contact_threads', {
  id: text('id').primaryKey(), tagCode: text('tag_code').notNull(), tokenHash: text('token_hash').notNull(),
  requesterHash: text('requester_hash').notNull(), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
  expiresAt: text('expires_at').notNull(), callbackCiphertext: text('callback_ciphertext'), callbackHint: text('callback_hint'),
  callStatus: text('call_status').notNull().default('not_requested'), callSid: text('call_sid'),
}, table => [index('contact_rate').on(table.requesterHash,table.createdAt),index('contact_time').on(table.updatedAt)]);
export const contactMessages = sqliteTable('contact_messages', {
  id: text('id').primaryKey(), threadId: text('thread_id').notNull().references(()=>contactThreads.id,{onDelete:'cascade'}),
  sender: text('sender').notNull(), content: text('content').notNull(), createdAt: text('created_at').notNull(),
  sequence: integer('sequence').notNull(),
  emailStatus: text('email_status').notNull().default('not_requested'),
  emailAttemptedAt: text('email_attempted_at'),
}, table => [index('contact_messages_thread').on(table.threadId,table.sequence)]);
