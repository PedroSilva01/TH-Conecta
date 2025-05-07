import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Seat, SeatReservation } from "@shared/schema";

// Define seat status types
type SeatStatus = "available" | "selected" | "occupied";

interface SeatMapProps {
  busLine: string;
  departureTime: Date;
  onSeatSelect: (seatNumber: string) => void;
  selectedSeat?: string;
}

export function SeatMap({ 
  busLine, 
  departureTime, 
  onSeatSelect, 
  selectedSeat 
}: SeatMapProps) {
  // Fetch reserved seats
  const { data: reservedSeats, isLoading } = useQuery<string[]>({
    queryKey: [`/api/seat-reservations/bus-line?busLine=${busLine}&departureTime=${departureTime.toISOString()}`],
    enabled: !!busLine && !!departureTime,
  });

  // Generate seats data (4 rows of 4 seats = 16 seats)
  const generateSeats = (): { number: string; status: SeatStatus }[] => {
    const seats = [];
    for (let i = 1; i <= 16; i++) {
      const seatNumber = i.toString();
      let status: SeatStatus = "available";
      
      // Check if seat is selected
      if (selectedSeat === seatNumber) {
        status = "selected";
      }
      // Check if seat is occupied
      else if (reservedSeats?.includes(seatNumber)) {
        status = "occupied";
      }
      
      seats.push({ number: seatNumber, status });
    }
    return seats;
  };
  
  const [seats, setSeats] = useState(generateSeats());
  
  // Update seats when reserved seats change
  useEffect(() => {
    setSeats(generateSeats());
  }, [reservedSeats, selectedSeat]);
  
  // Handle seat click
  const handleSeatClick = (seatNumber: string, status: SeatStatus) => {
    if (status === "occupied") return; // Can't select occupied seats
    
    // If seat is already selected, deselect it
    if (status === "selected") {
      onSeatSelect("");
    } else {
      onSeatSelect(seatNumber);
    }
  };
  
  // Assign className based on seat status
  const getSeatClass = (status: SeatStatus) => {
    switch (status) {
      case "selected":
        return "bg-primary border-primary text-white";
      case "occupied":
        return "bg-neutral-500 text-white cursor-not-allowed";
      default:
        return "bg-neutral-100 border-neutral-400 cursor-pointer hover:bg-neutral-200";
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center">
      {/* Driver Area */}
      <div className="w-16 h-10 bg-neutral-200 rounded-t-lg mb-8 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      </div>
      
      {/* Seats Grid */}
      <div className="grid grid-cols-4 gap-4 w-full max-w-xs">
        {seats.map((seat) => (
          <div
            key={seat.number}
            onClick={() => handleSeatClick(seat.number, seat.status)}
            className={`seat w-12 h-12 border rounded-md flex items-center justify-center ${getSeatClass(seat.status)}`}
          >
            {seat.number}
          </div>
        ))}
      </div>
    </div>
  );
}
