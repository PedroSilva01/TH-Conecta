import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertUserSchema, loginSchema, insertTicketSchema, insertSeatReservationSchema, insertTransactionSchema, insertRedemptionSchema, insertFavoriteRouteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // User information and documents
  app.get("/api/user/student-verification", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to check student verification status" });
    }
    
    try {
      // In a real app, fetch from database
      // For now, we'll return a mock status
      res.json({ 
        verified: false,
        expiryDate: null,
        message: "É necessário enviar um comprovante de matrícula válido."
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/user/student-verification", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to upload student verification" });
    }
    
    try {
      // In a real app, we'd save the file to storage and update the database
      // For now, we'll just simulate success
      
      // Validate the request
      const schema = z.object({
        documentBase64: z.string().min(1),
        documentType: z.string().min(1),
        institution: z.string().min(1),
      });
      
      const validatedData = schema.parse(req.body);
      
      // Set an expiry date for one year from now
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      res.status(201).json({
        verified: true,
        expiryDate: expiryDate.toISOString(),
        message: "Comprovante de estudante enviado com sucesso e válido até " + 
                 expiryDate.toLocaleDateString('pt-BR')
      });
    } catch (error) {
      next(error);
    }
  });

  // Bus Lines Routes
  app.get("/api/bus-lines", async (req, res, next) => {
    try {
      const { origin, destination } = req.query;
      
      let busLines;
      if (origin && destination) {
        busLines = await storage.getBusLinesByRoute(
          origin as string,
          destination as string
        );
      } else {
        busLines = await storage.getAllBusLines();
      }
      
      res.json(busLines);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/bus-lines/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const busLine = await storage.getBusLine(id);
      
      if (!busLine) {
        return res.status(404).json({ message: "Bus line not found" });
      }
      
      res.json(busLine);
    } catch (error) {
      next(error);
    }
  });

  // Tickets Routes
  app.post("/api/tickets", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to purchase tickets" });
    }
    
    try {
      // Convert date strings to proper Date objects and price to string if needed
      const formData = {
        ...req.body,
        departureTime: new Date(req.body.departureTime),
        arrivalTime: new Date(req.body.arrivalTime),
        price: typeof req.body.price === 'number' ? String(req.body.price) : req.body.price
      };
      
      const validatedData = insertTicketSchema.parse(formData);
      
      // Generate QR code (in a real app, use a proper QR code generation library)
      const qrCode = `XTESTE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const ticket = await storage.createTicket({
        ...validatedData,
        qrCode,
        userId: req.user!.id
      });
      
      // Create transaction record
      await storage.createTransaction({
        userId: req.user!.id,
        amount: String(-Number(validatedData.price)), // Convert to string with negative value
        type: 'purchase',
        description: `Ticket: ${validatedData.busLine} - ${validatedData.origin} to ${validatedData.destination}`,
        paymentMethod: req.body.paymentMethod || 'wallet',
        relatedEntityId: ticket.id,
        relatedEntityType: 'ticket'
      });
      
      // Update user balance
      const user = await storage.getUser(req.user!.id);
      if (user) {
        const newBalance = Number(user.balance) - Number(validatedData.price);
        await storage.updateUserBalance(user.id, newBalance);
        
        // Add points (1 point per real spent)
        const pointsToAdd = Math.floor(Number(validatedData.price));
        const newPoints = user.points + pointsToAdd;
        await storage.updateUserPoints(user.id, newPoints);
      }
      
      res.status(201).json(ticket);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/tickets", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to view tickets" });
    }
    
    try {
      const tickets = await storage.getTicketsByUser(req.user!.id);
      res.json(tickets);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/tickets/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to view ticket details" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const ticket = await storage.getTicket(id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      if (ticket.userId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have permission to view this ticket" });
      }
      
      res.json(ticket);
    } catch (error) {
      next(error);
    }
  });

  // Seat Reservations Routes
  app.post("/api/seat-reservations", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to reserve seats" });
    }
    
    try {
      // Parse date string to proper Date object if needed
      const formData = { 
        ...req.body,
        departureTime: new Date(req.body.departureTime),
        price: typeof req.body.price === 'number' ? String(req.body.price) : req.body.price
      };
      
      const validatedData = insertSeatReservationSchema.parse(formData);
      
      // Check if seat is already reserved
      const existingReservations = await storage.getSeatReservationsByBusLine(
        validatedData.busLine,
        validatedData.departureTime
      );
      
      const seatAlreadyReserved = existingReservations.some(
        reservation => reservation.seatNumber === validatedData.seatNumber
      );
      
      if (seatAlreadyReserved) {
        return res.status(400).json({ message: "This seat is already reserved" });
      }
      
      const reservation = await storage.createSeatReservation({
        ...validatedData,
        userId: req.user!.id
      });
      
      // Create transaction if there's a price
      if (Number(validatedData.price) > 0) {
        await storage.createTransaction({
          userId: req.user!.id,
          amount: String(-Number(validatedData.price)), // Convert to string
          type: 'purchase',
          description: `Seat Reservation: ${validatedData.busLine} - Seat ${validatedData.seatNumber}`,
          paymentMethod: req.body.paymentMethod || 'wallet',
          relatedEntityId: reservation.id,
          relatedEntityType: 'reservation'
        });
        
        // Update user balance
        const user = await storage.getUser(req.user!.id);
        if (user) {
          const newBalance = Number(user.balance) - Number(validatedData.price);
          await storage.updateUserBalance(user.id, newBalance);
        }
      }
      
      res.status(201).json(reservation);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/seat-reservations", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to view reservations" });
    }
    
    try {
      const reservations = await storage.getSeatReservationsByUser(req.user!.id);
      res.json(reservations);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/seat-reservations/bus-line", async (req, res, next) => {
    try {
      const { busLine, departureTime } = req.query;
      
      if (!busLine || !departureTime) {
        return res.status(400).json({ message: "Bus line and departure time are required" });
      }
      
      const reservations = await storage.getSeatReservationsByBusLine(
        busLine as string,
        new Date(departureTime as string)
      );
      
      // Return only seat numbers for privacy
      const reservedSeats = reservations.map(reservation => reservation.seatNumber);
      
      res.json(reservedSeats);
    } catch (error) {
      next(error);
    }
  });

  // Cultural Events Routes
  app.get("/api/cultural-events", async (req, res, next) => {
    try {
      const { category } = req.query;
      
      let events;
      if (category) {
        events = await storage.getCulturalEventsByCategory(category as string);
      } else {
        events = await storage.getAllCulturalEvents();
      }
      
      res.json(events);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/cultural-events/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getCulturalEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      next(error);
    }
  });

  // Rewards Routes
  app.get("/api/rewards", async (req, res, next) => {
    try {
      const rewards = await storage.getAllRewards();
      res.json(rewards);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/rewards/redeem", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to redeem rewards" });
    }
    
    try {
      const validatedData = insertRedemptionSchema.parse(req.body);
      
      // Get the reward
      const reward = await storage.getReward(validatedData.rewardId);
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      // Check if user has enough points
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.points < reward.pointsCost) {
        return res.status(400).json({ message: "Not enough points to redeem this reward" });
      }
      
      // Create redemption
      const redemption = await storage.createRedemption({
        ...validatedData,
        userId: req.user!.id,
        pointsSpent: reward.pointsCost
      });
      
      // Update user points
      const newPoints = user.points - reward.pointsCost;
      await storage.updateUserPoints(user.id, newPoints);
      
      res.status(201).json(redemption);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/rewards/redemptions", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to view redemptions" });
    }
    
    try {
      const redemptions = await storage.getRedemptionsByUser(req.user!.id);
      res.json(redemptions);
    } catch (error) {
      next(error);
    }
  });

  // Transactions Routes
  app.get("/api/transactions", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to view transactions" });
    }
    
    try {
      const transactions = await storage.getTransactionsByUser(req.user!.id);
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/transactions/recharge", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to recharge your balance" });
    }
    
    try {
      const schema = z.object({
        amount: z.number().positive(),
        paymentMethod: z.string()
      });
      
      const validatedData = schema.parse(req.body);
      
      // Create transaction
      const transaction = await storage.createTransaction({
        userId: req.user!.id,
        amount: String(validatedData.amount), // Convert to string for database
        type: 'recharge',
        description: `Balance recharge`,
        paymentMethod: validatedData.paymentMethod,
        relatedEntityId: null,
        relatedEntityType: null
      });
      
      // Update user balance
      const user = await storage.getUser(req.user!.id);
      if (user) {
        const newBalance = Number(user.balance) + validatedData.amount;
        await storage.updateUserBalance(user.id, newBalance);
      }
      
      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/transactions/buy-ticket", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to buy tickets" });
    }
    
    try {
      const schema = z.object({
        quantity: z.number().int().positive(),
        type: z.string(), // adult, student, child
        paymentMethod: z.string(),
        isDiscounted: z.boolean().optional().default(false)
      });
      
      const validatedData = schema.parse(req.body);
      
      // Calculate price based on type and time
      let unitPrice = 4.50; // Base price for adults
      
      // Apply discounts based on user type
      if (validatedData.type === "child") {
        unitPrice = 0; // Free for children under 10
      } else if (validatedData.type === "student") {
        unitPrice = 2.25; // 50% discount for students
      } else if (validatedData.type === "adult" && validatedData.isDiscounted) {
        unitPrice = 3.60; // 20% discount during off-peak hours
      }
      
      const totalAmount = unitPrice * validatedData.quantity;
      
      // Create transaction
      const transaction = await storage.createTransaction({
        userId: req.user!.id,
        amount: String(-totalAmount), // Negative because it's a purchase, convert to string
        type: 'purchase',
        description: `Compra de ${validatedData.quantity} vale-transporte${validatedData.quantity > 1 ? 's' : ''} (${validatedData.type})${validatedData.isDiscounted ? ' com desconto de horário' : ''}`,
        paymentMethod: validatedData.paymentMethod,
        relatedEntityId: null,
        relatedEntityType: 'ticket'
      });
      
      // Update user balance
      const user = await storage.getUser(req.user!.id);
      if (user) {
        const newBalance = Number(user.balance) - totalAmount;
        await storage.updateUserBalance(user.id, newBalance);
      }
      
      res.status(201).json({
        transaction,
        tickets: {
          quantity: validatedData.quantity,
          type: validatedData.type,
          unitPrice,
          totalAmount,
          isDiscounted: validatedData.isDiscounted
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Favorite Routes
  app.get("/api/favorite-routes", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to view favorite routes" });
    }
    
    try {
      const favoriteRoutes = await storage.getFavoriteRoutesByUser(req.user!.id);
      res.json(favoriteRoutes);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/favorite-routes", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to add favorite routes" });
    }
    
    try {
      const validatedData = insertFavoriteRouteSchema.parse(req.body);
      
      const favoriteRoute = await storage.createFavoriteRoute({
        ...validatedData,
        userId: req.user!.id
      });
      
      res.status(201).json(favoriteRoute);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/favorite-routes/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to delete favorite routes" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const favoriteRoute = await storage.getFavoriteRoute(id);
      
      if (!favoriteRoute) {
        return res.status(404).json({ message: "Favorite route not found" });
      }
      
      if (favoriteRoute.userId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have permission to delete this favorite route" });
      }
      
      await storage.deleteFavoriteRoute(id);
      
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
