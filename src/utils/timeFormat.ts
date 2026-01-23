/**
 * Convert 24-hour time format to 12-hour AM/PM format
 * @param time24 - Time in 24-hour format (e.g., "14:00" or "09:30")
 * @returns Time in 12-hour format (e.g., "2:00 PM" or "9:30 AM")
 */
export const formatTo12Hour = (time24: string): string => {
  if (!time24 || typeof time24 !== 'string') return time24;
  
  // Check if already in AM/PM format
  if (time24.toLowerCase().includes('am') || time24.toLowerCase().includes('pm')) {
    return time24;
  }
  
  const [hoursStr, minutesStr] = time24.split(':');
  if (!hoursStr || !minutesStr) return time24;
  
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  
  if (isNaN(hours) || isNaN(minutes)) return time24;
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Format a time range from 24-hour to 12-hour format
 * @param timeRange - Time range like "11:00 - 22:00"
 * @returns Formatted range like "11:00 AM - 10:00 PM"
 */
export const formatTimeRange = (timeRange: string): string => {
  if (!timeRange || typeof timeRange !== 'string') return timeRange;
  
  // Check if it's "Closed" or similar
  if (timeRange.toLowerCase() === 'closed' || timeRange.toLowerCase() === 'open') {
    return timeRange;
  }
  
  // Split by common separators
  const parts = timeRange.split(/\s*[-–]\s*/);
  
  if (parts.length === 2) {
    return `${formatTo12Hour(parts[0].trim())} - ${formatTo12Hour(parts[1].trim())}`;
  }
  
  return timeRange;
};

/**
 * Check if a restaurant is currently open based on opening hours
 * @param openingHours - Opening hours object from database
 * @returns { isOpen: boolean, nextChange: string | null }
 */
export const checkIfOpen = (openingHours: unknown): { isOpen: boolean; status: string } => {
  if (!openingHours || typeof openingHours !== 'object') {
    return { isOpen: false, status: 'Hours unknown' };
  }

  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayNamesShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const currentDay = dayNames[now.getDay()];
  const currentDayShort = dayNamesShort[now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

  const hoursObj = openingHours as Record<string, unknown>;
  
  // Try to find today's hours
  const dayData = hoursObj[currentDay] || hoursObj[currentDayShort];
  
  if (!dayData) {
    return { isOpen: false, status: 'Closed today' };
  }

  // Handle string format: "10:00 AM - 11:00 PM" or "10:00 - 23:00"
  if (typeof dayData === 'string') {
    if (dayData.toLowerCase() === 'closed') {
      return { isOpen: false, status: 'Closed today' };
    }
    
    const times = dayData.split(/\s*[-–]\s*/);
    if (times.length === 2) {
      const openTime = parseTimeToMinutes(times[0].trim());
      const closeTime = parseTimeToMinutes(times[1].trim());
      
      if (openTime !== null && closeTime !== null) {
        const isOpen = currentTime >= openTime && currentTime < closeTime;
        if (isOpen) {
          const closesIn = closeTime - currentTime;
          if (closesIn <= 60) {
            return { isOpen: true, status: `Closes in ${closesIn} min` };
          }
          return { isOpen: true, status: 'Open now' };
        } else if (currentTime < openTime) {
          return { isOpen: false, status: `Opens at ${formatTo12Hour(times[0].trim())}` };
        } else {
          return { isOpen: false, status: 'Closed' };
        }
      }
    }
    return { isOpen: true, status: 'Open' };
  }

  // Handle object format: { isOpen: true, openTime: "10:00", closeTime: "23:00" }
  if (typeof dayData === 'object') {
    const dayObj = dayData as { isOpen?: boolean; openTime?: string; closeTime?: string };
    
    if (!dayObj.isOpen) {
      return { isOpen: false, status: 'Closed today' };
    }
    
    if (dayObj.openTime && dayObj.closeTime) {
      const openTime = parseTimeToMinutes(dayObj.openTime);
      const closeTime = parseTimeToMinutes(dayObj.closeTime);
      
      if (openTime !== null && closeTime !== null) {
        const isOpen = currentTime >= openTime && currentTime < closeTime;
        if (isOpen) {
          const closesIn = closeTime - currentTime;
          if (closesIn <= 60) {
            return { isOpen: true, status: `Closes in ${closesIn} min` };
          }
          return { isOpen: true, status: 'Open now' };
        } else if (currentTime < openTime) {
          return { isOpen: false, status: `Opens at ${formatTo12Hour(dayObj.openTime)}` };
        } else {
          return { isOpen: false, status: 'Closed' };
        }
      }
    }
    return { isOpen: true, status: 'Open' };
  }

  return { isOpen: false, status: 'Hours unknown' };
};

/**
 * Parse time string to minutes since midnight
 */
const parseTimeToMinutes = (timeStr: string): number | null => {
  if (!timeStr) return null;
  
  const cleanTime = timeStr.trim().toUpperCase();
  
  // Handle AM/PM format
  const ampmMatch = cleanTime.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const period = ampmMatch[3]?.toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
  }
  
  // Handle 24-hour format
  const match24 = cleanTime.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }
  
  return null;
};
