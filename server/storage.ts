import { 
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type ChatThread,
  type InsertChatThread,
  type ChatMessage,
  type InsertChatMessage,
  type CodeExecution,
  type InsertCodeExecution,
  type UserConfig,
  type InsertUserConfig,
  type ProjectSnapshot,
  type InsertProjectSnapshot,
  type BuilderRun,
  type InsertBuilderRun,
  type DebugSession,
  type InsertDebugSession,
  type DeploymentRecord,
  type InsertDeploymentRecord,
  users,
  projects,
  chatThreads,
  chatMessages,
  codeExecutions,
  userConfig,
  projectSnapshots,
  builderRuns,
  debugSessions,
  deploymentRecords
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, isNull, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Project operations
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;

  // Thread operations (ChatGPT-style conversations)
  getThreads(type?: string): Promise<ChatThread[]>;
  getThread(id: number): Promise<ChatThread | undefined>;
  createThread(thread: InsertChatThread): Promise<ChatThread>;
  updateThreadTitle(id: number, title: string): Promise<ChatThread | undefined>;
  deleteThread(id: number): Promise<boolean>;

  // Chat operations
  getChatMessages(limit?: number, projectId?: string | null): Promise<ChatMessage[]>;
  getMessagesByThread(threadId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatHistory(projectId?: string | null): Promise<void>;

  // Code execution operations
  getCodeExecutions(limit?: number): Promise<CodeExecution[]>;
  createCodeExecution(execution: InsertCodeExecution): Promise<CodeExecution>;

  // Config operations
  getConfig(): Promise<UserConfig | undefined>;
  updateConfig(config: InsertUserConfig): Promise<UserConfig>;

  // Project snapshot operations
  getProjectSnapshots(projectId: string): Promise<ProjectSnapshot[]>;
  getSnapshot(id: number): Promise<ProjectSnapshot | undefined>;
  createSnapshot(snapshot: InsertProjectSnapshot): Promise<ProjectSnapshot>;

  // Builder run operations
  getBuilderRuns(projectId?: string): Promise<BuilderRun[]>;
  getBuilderRun(id: number): Promise<BuilderRun | undefined>;
  createBuilderRun(run: InsertBuilderRun): Promise<BuilderRun>;
  updateBuilderRun(id: number, run: Partial<InsertBuilderRun>): Promise<BuilderRun | undefined>;

  // Debug session operations
  getDebugSessions(projectId: string): Promise<DebugSession[]>;
  getDebugSession(id: number): Promise<DebugSession | undefined>;
  createDebugSession(session: InsertDebugSession): Promise<DebugSession>;
  updateDebugSession(id: number, session: Partial<InsertDebugSession>): Promise<DebugSession | undefined>;

  // Deployment record operations
  getDeployments(projectId: string): Promise<DeploymentRecord[]>;
  getDeployment(id: number): Promise<DeploymentRecord | undefined>;
  createDeployment(deployment: InsertDeploymentRecord): Promise<DeploymentRecord>;
  updateDeployment(id: number, deployment: Partial<InsertDeploymentRecord>): Promise<DeploymentRecord | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(desc(projects.updatedAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set({ ...project, updatedAt: sql`NOW()` })
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Thread operations (ChatGPT-style conversations)
  async getThreads(type: string = "chat"): Promise<ChatThread[]> {
    return db.select().from(chatThreads).where(eq(chatThreads.type, type)).orderBy(desc(chatThreads.updatedAt));
  }

  async getThread(id: number): Promise<ChatThread | undefined> {
    const [thread] = await db.select().from(chatThreads).where(eq(chatThreads.id, id)).limit(1);
    return thread;
  }

  async createThread(thread: InsertChatThread): Promise<ChatThread> {
    const [newThread] = await db.insert(chatThreads).values(thread).returning();
    return newThread;
  }

  async updateThreadTitle(id: number, title: string): Promise<ChatThread | undefined> {
    const [updated] = await db
      .update(chatThreads)
      .set({ title, updatedAt: sql`NOW()` })
      .where(eq(chatThreads.id, id))
      .returning();
    return updated;
  }

  async deleteThread(id: number): Promise<boolean> {
    // Delete all messages in the thread first
    await db.delete(chatMessages).where(eq(chatMessages.threadId, id));
    const result = await db.delete(chatThreads).where(eq(chatThreads.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Chat operations with projectId support
  async getChatMessages(limit: number = 50, projectId: string | null = null): Promise<ChatMessage[]> {
    if (projectId) {
      return db.select()
        .from(chatMessages)
        .where(eq(chatMessages.projectId, projectId))
        .orderBy(chatMessages.createdAt)
        .limit(limit);
    }
    return db.select()
      .from(chatMessages)
      .where(isNull(chatMessages.projectId))
      .orderBy(chatMessages.createdAt)
      .limit(limit);
  }

  async getMessagesByThread(threadId: number): Promise<ChatMessage[]> {
    return db.select()
      .from(chatMessages)
      .where(eq(chatMessages.threadId, threadId))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  async clearChatHistory(projectId: string | null = null): Promise<void> {
    if (projectId) {
      await db.delete(chatMessages).where(eq(chatMessages.projectId, projectId));
    } else {
      await db.delete(chatMessages).where(isNull(chatMessages.projectId));
    }
  }

  // Code execution operations
  async getCodeExecutions(limit: number = 20): Promise<CodeExecution[]> {
    return db.select().from(codeExecutions).orderBy(desc(codeExecutions.createdAt)).limit(limit);
  }

  async createCodeExecution(execution: InsertCodeExecution): Promise<CodeExecution> {
    const [newExecution] = await db.insert(codeExecutions).values(execution).returning();
    return newExecution;
  }

  // Config operations
  async getConfig(): Promise<UserConfig | undefined> {
    const [config] = await db.select().from(userConfig).limit(1);
    return config;
  }

  async updateConfig(config: InsertUserConfig): Promise<UserConfig> {
    const existing = await this.getConfig();
    
    if (existing) {
      const [updated] = await db
        .update(userConfig)
        .set({ ...config, updatedAt: sql`NOW()` })
        .where(eq(userConfig.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userConfig).values(config).returning();
      return created;
    }
  }

  // Project snapshot operations
  async getProjectSnapshots(projectId: string): Promise<ProjectSnapshot[]> {
    return db.select().from(projectSnapshots).where(eq(projectSnapshots.projectId, projectId)).orderBy(desc(projectSnapshots.createdAt));
  }

  async getSnapshot(id: number): Promise<ProjectSnapshot | undefined> {
    const [snapshot] = await db.select().from(projectSnapshots).where(eq(projectSnapshots.id, id)).limit(1);
    return snapshot;
  }

  async createSnapshot(snapshot: InsertProjectSnapshot): Promise<ProjectSnapshot> {
    const [newSnapshot] = await db.insert(projectSnapshots).values(snapshot).returning();
    return newSnapshot;
  }

  // Builder run operations
  async getBuilderRuns(projectId?: string): Promise<BuilderRun[]> {
    if (projectId) {
      return db.select().from(builderRuns).where(eq(builderRuns.projectId, projectId)).orderBy(desc(builderRuns.createdAt));
    }
    return db.select().from(builderRuns).orderBy(desc(builderRuns.createdAt));
  }

  async getBuilderRun(id: number): Promise<BuilderRun | undefined> {
    const [run] = await db.select().from(builderRuns).where(eq(builderRuns.id, id)).limit(1);
    return run;
  }

  async createBuilderRun(run: InsertBuilderRun): Promise<BuilderRun> {
    const [newRun] = await db.insert(builderRuns).values(run).returning();
    return newRun;
  }

  async updateBuilderRun(id: number, run: Partial<InsertBuilderRun>): Promise<BuilderRun | undefined> {
    const [updated] = await db.update(builderRuns).set({ ...run, updatedAt: sql`NOW()` }).where(eq(builderRuns.id, id)).returning();
    return updated;
  }

  // Debug session operations
  async getDebugSessions(projectId: string): Promise<DebugSession[]> {
    return db.select().from(debugSessions).where(eq(debugSessions.projectId, projectId)).orderBy(desc(debugSessions.createdAt));
  }

  async getDebugSession(id: number): Promise<DebugSession | undefined> {
    const [session] = await db.select().from(debugSessions).where(eq(debugSessions.id, id)).limit(1);
    return session;
  }

  async createDebugSession(session: InsertDebugSession): Promise<DebugSession> {
    const [newSession] = await db.insert(debugSessions).values(session).returning();
    return newSession;
  }

  async updateDebugSession(id: number, session: Partial<InsertDebugSession>): Promise<DebugSession | undefined> {
    const [updated] = await db.update(debugSessions).set({ ...session, updatedAt: sql`NOW()` }).where(eq(debugSessions.id, id)).returning();
    return updated;
  }

  // Deployment record operations
  async getDeployments(projectId: string): Promise<DeploymentRecord[]> {
    return db.select().from(deploymentRecords).where(eq(deploymentRecords.projectId, projectId)).orderBy(desc(deploymentRecords.createdAt));
  }

  async getDeployment(id: number): Promise<DeploymentRecord | undefined> {
    const [deployment] = await db.select().from(deploymentRecords).where(eq(deploymentRecords.id, id)).limit(1);
    return deployment;
  }

  async createDeployment(deployment: InsertDeploymentRecord): Promise<DeploymentRecord> {
    const [newDeployment] = await db.insert(deploymentRecords).values(deployment).returning();
    return newDeployment;
  }

  async updateDeployment(id: number, deployment: Partial<InsertDeploymentRecord>): Promise<DeploymentRecord | undefined> {
    const [updated] = await db.update(deploymentRecords).set({ ...deployment, updatedAt: sql`NOW()` }).where(eq(deploymentRecords.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
