import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  files: jsonb("files").notNull().default([]),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Chat threads table (like ChatGPT conversations)
export const chatThreads = pgTable("chat_threads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default("New Chat"),
  projectId: text("project_id"),
  type: text("type").notNull().default("chat"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertChatThreadSchema = createInsertSchema(chatThreads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertChatThread = z.infer<typeof insertChatThreadSchema>;
export type ChatThread = typeof chatThreads.$inferSelect;

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id"),
  role: text("role").notNull(),
  content: text("content").notNull(),
  codeContext: text("code_context"),
  projectId: text("project_id"),
  attachments: jsonb("attachments").default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Code executions table
export const codeExecutions = pgTable("code_executions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  language: text("language").notNull(),
  output: text("output"),
  error: text("error"),
  exitCode: text("exit_code"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCodeExecutionSchema = createInsertSchema(codeExecutions).omit({
  id: true,
  createdAt: true,
});

export type InsertCodeExecution = z.infer<typeof insertCodeExecutionSchema>;
export type CodeExecution = typeof codeExecutions.$inferSelect;

// User config table
export const userConfig = pgTable("user_config", {
  id: serial("id").primaryKey(),
  backendUrl: text("backend_url"),
  apiKey: text("api_key"),
  perplexityKey: text("perplexity_key"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserConfigSchema = createInsertSchema(userConfig).omit({
  id: true,
  updatedAt: true,
});

export type InsertUserConfig = z.infer<typeof insertUserConfigSchema>;
export type UserConfig = typeof userConfig.$inferSelect;

// Project snapshots table - stores versioned copies of project files
export const projectSnapshots = pgTable("project_snapshots", {
  id: serial("id").primaryKey(),
  projectId: varchar("project_id").notNull(),
  label: text("label").notNull().default("v1"),
  files: jsonb("files").notNull().default([]),
  summary: text("summary"),
  prompt: text("prompt"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProjectSnapshotSchema = createInsertSchema(projectSnapshots).omit({
  id: true,
  createdAt: true,
});

export type InsertProjectSnapshot = z.infer<typeof insertProjectSnapshotSchema>;
export type ProjectSnapshot = typeof projectSnapshots.$inferSelect;

// Builder runs table - tracks all AI interactions (generate, debug, deploy)
export const builderRuns = pgTable("builder_runs", {
  id: serial("id").primaryKey(),
  projectId: varchar("project_id"),
  snapshotId: integer("snapshot_id"),
  type: text("type").notNull().default("generation"),
  status: text("status").notNull().default("pending"),
  prompt: text("prompt"),
  aiResponse: text("ai_response"),
  diff: jsonb("diff"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBuilderRunSchema = createInsertSchema(builderRuns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBuilderRun = z.infer<typeof insertBuilderRunSchema>;
export type BuilderRun = typeof builderRuns.$inferSelect;

// Debug sessions table - tracks debugging workflows
export const debugSessions = pgTable("debug_sessions", {
  id: serial("id").primaryKey(),
  projectId: varchar("project_id").notNull(),
  snapshotId: integer("snapshot_id"),
  errorLog: text("error_log").notNull(),
  analysis: text("analysis"),
  fixedFiles: jsonb("fixed_files"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDebugSessionSchema = createInsertSchema(debugSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDebugSession = z.infer<typeof insertDebugSessionSchema>;
export type DebugSession = typeof debugSessions.$inferSelect;

// Deployment records table - tracks deployment attempts
export const deploymentRecords = pgTable("deployment_records", {
  id: serial("id").primaryKey(),
  projectId: varchar("project_id").notNull(),
  snapshotId: integer("snapshot_id"),
  platform: text("platform").notNull(),
  status: text("status").notNull().default("pending"),
  config: jsonb("config"),
  deployUrl: text("deploy_url"),
  logs: text("logs"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDeploymentRecordSchema = createInsertSchema(deploymentRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDeploymentRecord = z.infer<typeof insertDeploymentRecordSchema>;
export type DeploymentRecord = typeof deploymentRecords.$inferSelect;
