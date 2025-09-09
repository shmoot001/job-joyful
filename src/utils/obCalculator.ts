import { parseISO, getDay, getHours, getMinutes } from 'date-fns';

interface OBEligibilityParams {
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  hours: number;
  obRate: number;
}

export const calculateOBHours = ({ date, startTime, endTime, hours, obRate }: OBEligibilityParams): { obHours: number; obAmount: number } => {
  if (obRate === 0) {
    return { obHours: 0, obAmount: 0 };
  }

  const shiftDate = parseISO(date);
  const dayOfWeek = getDay(shiftDate); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  // Convert times to minutes for easier calculation
  const startMinutes = startHour * 60 + startMinute;
  let endMinutes = endHour * 60 + endMinute;
  
  // Handle overnight shifts
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60; // Add 24 hours in minutes
  }
  
  let obMinutes = 0;
  
  // Sunday (0) - entire day is OB
  if (dayOfWeek === 0) {
    obMinutes = endMinutes - startMinutes;
  }
  // Monday to Friday (1-5) - OB from 20:00 onwards
  else if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    const obStartTime = 20 * 60; // 20:00 in minutes
    
    // Check if shift overlaps with OB time
    if (endMinutes > obStartTime) {
      const obStart = Math.max(startMinutes, obStartTime);
      obMinutes = endMinutes - obStart;
    }
    
    // Handle overnight shifts that continue to next day
    if (endMinutes > 24 * 60) {
      const nextDay = (dayOfWeek + 1) % 7;
      // If next day is Saturday, OB continues until 16:00
      if (nextDay === 6) {
        const saturdayOBEnd = 24 * 60 + 16 * 60; // 16:00 next day
        const actualEnd = Math.min(endMinutes, saturdayOBEnd);
        const overnightOB = actualEnd - 24 * 60;
        obMinutes += Math.max(0, overnightOB);
      }
      // If next day is Sunday, entire next day is OB
      else if (nextDay === 0) {
        const sundayOB = endMinutes - 24 * 60;
        obMinutes += Math.max(0, sundayOB);
      }
    }
  }
  // Saturday (6) - OB from 16:00 onwards
  else if (dayOfWeek === 6) {
    const obStartTime = 16 * 60; // 16:00 in minutes
    
    // Check if shift overlaps with OB time
    if (endMinutes > obStartTime) {
      const obStart = Math.max(startMinutes, obStartTime);
      obMinutes = endMinutes - obStart;
    }
    
    // Handle overnight shifts that continue to Sunday
    if (endMinutes > 24 * 60) {
      const sundayOB = endMinutes - 24 * 60;
      obMinutes += Math.max(0, sundayOB);
    }
  }
  
  // Convert back to hours and ensure we don't exceed actual working hours
  const obHours = Math.min(obMinutes / 60, hours);
  const obAmount = obHours * obRate;
  
  return { obHours: Math.max(0, obHours), obAmount: Math.max(0, obAmount) };
};

export const calculateTotalEarnings = (
  hours: number,
  hourlyRate: number,
  obHours: number,
  obRate: number,
  taxRate: number = 0.33
): { grossEarnings: number; netEarnings: number; obAmount: number } => {
  const baseEarnings = hours * hourlyRate;
  const obAmount = obHours * obRate;
  const grossEarnings = baseEarnings + obAmount;
  const netEarnings = grossEarnings * (1 - taxRate);
  
  return {
    grossEarnings,
    netEarnings,
    obAmount
  };
};