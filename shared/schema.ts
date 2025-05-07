import { pgTable, text, serial, integer, boolean, timestamp, numeric, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  balance: numeric("balance", { precision: 10, scale: 2 }).default("0").notNull(),
  points: integer("points").default(0).notNull(),
  level: text("level").default("Bronze").notNull(),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  busLine: text("bus_line").notNull(),
  departureTime: timestamp("departure_time").notNull(),
  arrivalTime: timestamp("arrival_time").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  passengers: json("passengers").notNull(),
  qrCode: text("qr_code").notNull(),
  purchaseDate: timestamp("purchase_date").defaultNow().notNull(),
  status: text("status").default("active").notNull(),
});

export const seatReservations = pgTable("seat_reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  busLine: text("bus_line").notNull(),
  departureTime: timestamp("departure_time").notNull(),
  seatNumber: text("seat_number").notNull(),
  reservationDate: timestamp("reservation_date").defaultNow().notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).default("0").notNull(),
  status: text("status").default("active").notNull(),
});

export const busLines = pgTable("bus_lines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  departureTime: text("departure_time").notNull(),
  arrivalTime: text("arrival_time").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  lowOccupancy: boolean("low_occupancy").default(true),
  hasWifi: boolean("has_wifi").default(false),
  isAccessible: boolean("is_accessible").default(true),
});

export const culturalEvents = pgTable("cultural_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  category: text("category").notNull(),
  price: text("price").notNull(),
  discount: text("discount"),
  imageUrl: text("image_url"),
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  pointsCost: integer("points_cost").notNull(),
  category: text("category").notNull(),
  iconName: text("icon_name").notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // 'recharge', 'purchase', 'points_conversion'
  description: text("description").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  paymentMethod: text("payment_method"),
  relatedEntityId: integer("related_entity_id"),
  relatedEntityType: text("related_entity_type"),
});

export const redemptions = pgTable("redemptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  rewardId: integer("reward_id").notNull().references(() => rewards.id),
  pointsSpent: integer("points_spent").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  status: text("status").default("active").notNull(),
});

export const favoriteRoutes = pgTable("favorite_routes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  busLine: text("bus_line"),
  name: text("name"),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  purchaseDate: true
});

export const insertSeatReservationSchema = createInsertSchema(seatReservations).omit({
  id: true,
  reservationDate: true
});

export const insertBusLineSchema = createInsertSchema(busLines).omit({
  id: true
});

export const insertCulturalEventSchema = createInsertSchema(culturalEvents).omit({
  id: true
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  date: true
});

export const insertRedemptionSchema = createInsertSchema(redemptions).omit({
  id: true,
  date: true
});

export const insertFavoriteRouteSchema = createInsertSchema(favoriteRoutes).omit({
  id: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type SeatReservation = typeof seatReservations.$inferSelect;
export type InsertSeatReservation = z.infer<typeof insertSeatReservationSchema>;

export type BusLine = typeof busLines.$inferSelect;
export type InsertBusLine = z.infer<typeof insertBusLineSchema>;

export type CulturalEvent = typeof culturalEvents.$inferSelect;
export type InsertCulturalEvent = z.infer<typeof insertCulturalEventSchema>;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Redemption = typeof redemptions.$inferSelect;
export type InsertRedemption = z.infer<typeof insertRedemptionSchema>;

export type FavoriteRoute = typeof favoriteRoutes.$inferSelect;
export type InsertFavoriteRoute = z.infer<typeof insertFavoriteRouteSchema>;

// Login credentials schema
export const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" })
});

export type LoginData = z.infer<typeof loginSchema>;

// Extended registration schema with validation
export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, { message: "Confirm password is required" })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export type RegisterData = z.infer<typeof registerSchema>;
