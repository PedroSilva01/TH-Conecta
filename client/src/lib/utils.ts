import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a number as currency (BRL)
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// Generate a random QR code string
export function generateQRCode(): string {
  return `XTESTE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Format a date string to a readable format
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  }).format(date);
}

// Format a time string to a readable format
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  }).format(date);
}

// Calculate time difference in minutes between two dates
export function calculateTimeDifference(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

// Get initial letters from a name for avatar
export function getInitials(name: string): string {
  if (!name) return "";
  
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Convert number to star rating
export function getStarRating(rating: number): string {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  
  let stars = '★'.repeat(fullStars);
  if (halfStar) stars += '½';
  
  return stars + '☆'.repeat(5 - Math.ceil(rating));
}
