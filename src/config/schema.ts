
import { mysqlTable, int, varchar, text, decimal, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";

// Tabel users
export const users = mysqlTable("users", {
    id: int("id").autoincrement().primaryKey(),
    username: varchar("username", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .onUpdateNow()
        .notNull(),
});

// Tabel products
export const products = mysqlTable("products", {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    stock: int("stock").notNull().default(0),
    description: text("description").notNull(),
    imageUrl: text("image_url").notNull(),
    imagePublicId: text("image_public_id").notNull(),
    status: mysqlEnum("status", ["published", "deleted"])
        .notNull()
        .default("published"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .onUpdateNow()
        .notNull(),
});

