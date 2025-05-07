import { users, tickets, seatReservations, busLines, culturalEvents, rewards, transactions, redemptions, favoriteRoutes } from "@shared/schema";
import type { User, InsertUser, Ticket, InsertTicket, SeatReservation, InsertSeatReservation, BusLine, InsertBusLine, CulturalEvent, InsertCulturalEvent, Reward, InsertReward, Transaction, InsertTransaction, Redemption, InsertRedemption, FavoriteRoute, InsertFavoriteRoute } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, newBalance: number): Promise<User>;
  updateUserPoints(userId: number, newPoints: number): Promise<User>;
  updateUserLevel(userId: number, newLevel: string): Promise<User>;
  
  // Ticket methods
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getTicket(id: number): Promise<Ticket | undefined>;
  getTicketsByUser(userId: number): Promise<Ticket[]>;
  
  // Seat reservation methods
  createSeatReservation(reservation: InsertSeatReservation): Promise<SeatReservation>;
  getSeatReservation(id: number): Promise<SeatReservation | undefined>;
  getSeatReservationsByUser(userId: number): Promise<SeatReservation[]>;
  getSeatReservationsByBusLine(busLine: string, departureTime: Date): Promise<SeatReservation[]>;
  
  // Bus line methods
  createBusLine(busLine: InsertBusLine): Promise<BusLine>;
  getBusLine(id: number): Promise<BusLine | undefined>;
  getAllBusLines(): Promise<BusLine[]>;
  getBusLinesByRoute(origin: string, destination: string): Promise<BusLine[]>;
  
  // Cultural event methods
  createCulturalEvent(event: InsertCulturalEvent): Promise<CulturalEvent>;
  getCulturalEvent(id: number): Promise<CulturalEvent | undefined>;
  getAllCulturalEvents(): Promise<CulturalEvent[]>;
  getCulturalEventsByCategory(category: string): Promise<CulturalEvent[]>;
  
  // Reward methods
  createReward(reward: InsertReward): Promise<Reward>;
  getReward(id: number): Promise<Reward | undefined>;
  getAllRewards(): Promise<Reward[]>;
  
  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByUser(userId: number): Promise<Transaction[]>;
  
  // Redemption methods
  createRedemption(redemption: InsertRedemption): Promise<Redemption>;
  getRedemption(id: number): Promise<Redemption | undefined>;
  getRedemptionsByUser(userId: number): Promise<Redemption[]>;
  
  // Favorite route methods
  createFavoriteRoute(favoriteRoute: InsertFavoriteRoute): Promise<FavoriteRoute>;
  getFavoriteRoute(id: number): Promise<FavoriteRoute | undefined>;
  getFavoriteRoutesByUser(userId: number): Promise<FavoriteRoute[]>;
  deleteFavoriteRoute(id: number): Promise<void>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private ticketsData: Map<number, Ticket>;
  private seatReservationsData: Map<number, SeatReservation>;
  private busLinesData: Map<number, BusLine>;
  private culturalEventsData: Map<number, CulturalEvent>;
  private rewardsData: Map<number, Reward>;
  private transactionsData: Map<number, Transaction>;
  private redemptionsData: Map<number, Redemption>;
  private favoriteRoutesData: Map<number, FavoriteRoute>;
  
  public sessionStore: session.SessionStore;
  
  private currentIds: {
    users: number;
    tickets: number;
    seatReservations: number;
    busLines: number;
    culturalEvents: number;
    rewards: number;
    transactions: number;
    redemptions: number;
    favoriteRoutes: number;
  };

  constructor() {
    this.usersData = new Map();
    this.ticketsData = new Map();
    this.seatReservationsData = new Map();
    this.busLinesData = new Map();
    this.culturalEventsData = new Map();
    this.rewardsData = new Map();
    this.transactionsData = new Map();
    this.redemptionsData = new Map();
    this.favoriteRoutesData = new Map();
    
    this.currentIds = {
      users: 1,
      tickets: 1,
      seatReservations: 1,
      busLines: 1,
      culturalEvents: 1,
      rewards: 1,
      transactions: 1,
      redemptions: 1,
      favoriteRoutes: 1
    };
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with sample data
    this.initSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = { ...insertUser, id };
    this.usersData.set(id, user);
    return user;
  }
  
  async updateUserBalance(userId: number, newBalance: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, balance: newBalance };
    this.usersData.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserPoints(userId: number, newPoints: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, points: newPoints };
    this.usersData.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserLevel(userId: number, newLevel: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, level: newLevel };
    this.usersData.set(userId, updatedUser);
    return updatedUser;
  }

  // Ticket methods
  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const id = this.currentIds.tickets++;
    const newTicket: Ticket = { ...ticket, id };
    this.ticketsData.set(id, newTicket);
    return newTicket;
  }
  
  async getTicket(id: number): Promise<Ticket | undefined> {
    return this.ticketsData.get(id);
  }
  
  async getTicketsByUser(userId: number): Promise<Ticket[]> {
    return Array.from(this.ticketsData.values()).filter(
      ticket => ticket.userId === userId
    );
  }

  // Seat reservation methods
  async createSeatReservation(reservation: InsertSeatReservation): Promise<SeatReservation> {
    const id = this.currentIds.seatReservations++;
    const newReservation: SeatReservation = { ...reservation, id };
    this.seatReservationsData.set(id, newReservation);
    return newReservation;
  }
  
  async getSeatReservation(id: number): Promise<SeatReservation | undefined> {
    return this.seatReservationsData.get(id);
  }
  
  async getSeatReservationsByUser(userId: number): Promise<SeatReservation[]> {
    return Array.from(this.seatReservationsData.values()).filter(
      reservation => reservation.userId === userId
    );
  }
  
  async getSeatReservationsByBusLine(busLine: string, departureTime: Date): Promise<SeatReservation[]> {
    return Array.from(this.seatReservationsData.values()).filter(
      reservation => reservation.busLine === busLine && reservation.departureTime.getTime() === departureTime.getTime()
    );
  }

  // Bus line methods
  async createBusLine(busLine: InsertBusLine): Promise<BusLine> {
    const id = this.currentIds.busLines++;
    const newBusLine: BusLine = { ...busLine, id };
    this.busLinesData.set(id, newBusLine);
    return newBusLine;
  }
  
  async getBusLine(id: number): Promise<BusLine | undefined> {
    return this.busLinesData.get(id);
  }
  
  async getAllBusLines(): Promise<BusLine[]> {
    return Array.from(this.busLinesData.values());
  }
  
  async getBusLinesByRoute(origin: string, destination: string): Promise<BusLine[]> {
    return Array.from(this.busLinesData.values()).filter(
      busLine => busLine.origin === origin && busLine.destination === destination
    );
  }

  // Cultural event methods
  async createCulturalEvent(event: InsertCulturalEvent): Promise<CulturalEvent> {
    const id = this.currentIds.culturalEvents++;
    const newEvent: CulturalEvent = { ...event, id };
    this.culturalEventsData.set(id, newEvent);
    return newEvent;
  }
  
  async getCulturalEvent(id: number): Promise<CulturalEvent | undefined> {
    return this.culturalEventsData.get(id);
  }
  
  async getAllCulturalEvents(): Promise<CulturalEvent[]> {
    return Array.from(this.culturalEventsData.values());
  }
  
  async getCulturalEventsByCategory(category: string): Promise<CulturalEvent[]> {
    return Array.from(this.culturalEventsData.values()).filter(
      event => event.category === category
    );
  }

  // Reward methods
  async createReward(reward: InsertReward): Promise<Reward> {
    const id = this.currentIds.rewards++;
    const newReward: Reward = { ...reward, id };
    this.rewardsData.set(id, newReward);
    return newReward;
  }
  
  async getReward(id: number): Promise<Reward | undefined> {
    return this.rewardsData.get(id);
  }
  
  async getAllRewards(): Promise<Reward[]> {
    return Array.from(this.rewardsData.values());
  }

  // Transaction methods
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentIds.transactions++;
    const newTransaction: Transaction = { ...transaction, id };
    this.transactionsData.set(id, newTransaction);
    return newTransaction;
  }
  
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactionsData.get(id);
  }
  
  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactionsData.values()).filter(
      transaction => transaction.userId === userId
    );
  }

  // Redemption methods
  async createRedemption(redemption: InsertRedemption): Promise<Redemption> {
    const id = this.currentIds.redemptions++;
    const newRedemption: Redemption = { ...redemption, id };
    this.redemptionsData.set(id, newRedemption);
    return newRedemption;
  }
  
  async getRedemption(id: number): Promise<Redemption | undefined> {
    return this.redemptionsData.get(id);
  }
  
  async getRedemptionsByUser(userId: number): Promise<Redemption[]> {
    return Array.from(this.redemptionsData.values()).filter(
      redemption => redemption.userId === userId
    );
  }

  // Favorite route methods
  async createFavoriteRoute(favoriteRoute: InsertFavoriteRoute): Promise<FavoriteRoute> {
    const id = this.currentIds.favoriteRoutes++;
    const newFavoriteRoute: FavoriteRoute = { ...favoriteRoute, id };
    this.favoriteRoutesData.set(id, newFavoriteRoute);
    return newFavoriteRoute;
  }
  
  async getFavoriteRoute(id: number): Promise<FavoriteRoute | undefined> {
    return this.favoriteRoutesData.get(id);
  }
  
  async getFavoriteRoutesByUser(userId: number): Promise<FavoriteRoute[]> {
    return Array.from(this.favoriteRoutesData.values()).filter(
      favoriteRoute => favoriteRoute.userId === userId
    );
  }
  
  async deleteFavoriteRoute(id: number): Promise<void> {
    this.favoriteRoutesData.delete(id);
  }

  // Initialize sample data for testing
  private initSampleData() {
    // Sample bus lines
    const busLines: InsertBusLine[] = [
      {
        name: "Linha 123", 
        origin: "Terminal Central", 
        destination: "Shopping Norte",
        departureTime: "11:30",
        arrivalTime: "12:00",
        price: 4.50,
        lowOccupancy: true,
        hasWifi: true,
        isAccessible: true
      },
      {
        name: "Linha 456", 
        origin: "Terminal Central", 
        destination: "Shopping Norte",
        departureTime: "11:45",
        arrivalTime: "12:20",
        price: 4.50,
        lowOccupancy: false,
        hasWifi: true,
        isAccessible: true
      },
      {
        name: "Linha 789", 
        origin: "Terminal Sul", 
        destination: "Centro",
        departureTime: "12:30",
        arrivalTime: "13:00",
        price: 5.00,
        lowOccupancy: true,
        hasWifi: false,
        isAccessible: true
      }
    ];
    
    busLines.forEach(busLine => {
      this.createBusLine(busLine);
    });
    
    // Sample cultural events
    const events: InsertCulturalEvent[] = [
      {
        title: "Festival de Música no Terminal",
        description: "Venha curtir uma noite de música ao vivo com bandas locais no Terminal Central. Evento gratuito para todos os passageiros.",
        location: "Terminal Central",
        date: "25 Out",
        time: "19:00",
        category: "Música",
        price: "Gratuito",
        discount: null,
        imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4"
      },
      {
        title: "Exposição de Arte Urbana",
        description: "Exposição de artistas locais com obras inspiradas no cotidiano urbano e no transporte público da cidade.",
        location: "Terminal Sul",
        date: "22-29 Out",
        time: "10:00-18:00",
        category: "Exposição",
        price: "R$ 10,00",
        discount: "15% de desconto",
        imageUrl: "https://images.unsplash.com/photo-1531058020387-3be344556be6"
      }
    ];
    
    events.forEach(event => {
      this.createCulturalEvent(event);
    });
    
    // Sample rewards
    const rewards: InsertReward[] = [
      {
        title: "Viagem Gratuita",
        description: "Troque seus pontos por uma passagem gratuita para qualquer linha.",
        pointsCost: 500,
        category: "travel",
        iconName: "confirmation_number"
      },
      {
        title: "Desconto em Eventos",
        description: "20% de desconto em eventos culturais selecionados.",
        pointsCost: 300,
        category: "discount",
        iconName: "local_activity"
      },
      {
        title: "Reserva de Assento Premium",
        description: "Reserve assentos preferenciais em linhas selecionadas.",
        pointsCost: 200,
        category: "seat",
        iconName: "airline_seat_recline_extra"
      }
    ];
    
    rewards.forEach(reward => {
      this.createReward(reward);
    });
  }
}

export const storage = new MemStorage();
