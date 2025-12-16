export interface ICalEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  calendarName: string;
}

// Security limits
const MAX_ICAL_SIZE = 10_000_000; // 10MB
const MAX_EVENTS = 10_000;
const MAX_LINE_LENGTH = 10_000;

export function parseICalData(icalData: string, calendarName: string): ICalEvent[] {
  // Security: Check size limit to prevent memory exhaustion
  if (icalData.length > MAX_ICAL_SIZE) {
    console.error('iCal data exceeds maximum size limit');
    throw new Error('Calendar file too large (max 10MB)');
  }

  const events: ICalEvent[] = [];
  const lines = icalData.split('\n').map(line => {
    // Truncate extremely long lines to prevent DoS
    return line.trim().substring(0, MAX_LINE_LENGTH);
  });
  
  let currentEvent: Partial<ICalEvent> = {};
  let inEvent = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Stop if we've reached the event limit
    if (events.length >= MAX_EVENTS) {
      console.warn(`Calendar has too many events, limiting to ${MAX_EVENTS}`);
      break;
    }
    
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = { calendarName };
    } else if (line === 'END:VEVENT' && inEvent) {
      if (currentEvent.title && currentEvent.start) {
        events.push(currentEvent as ICalEvent);
      }
      currentEvent = {};
      inEvent = false;
    } else if (inEvent) {
      try {
        if (line.startsWith('UID:')) {
          currentEvent.id = sanitizeText(line.substring(4));
        } else if (line.startsWith('SUMMARY:')) {
          currentEvent.title = sanitizeText(line.substring(8));
        } else if (line.startsWith('DESCRIPTION:')) {
          currentEvent.description = sanitizeText(line.substring(12));
        } else if (line.startsWith('LOCATION:')) {
          currentEvent.location = sanitizeText(line.substring(9));
        } else if (line.startsWith('DTSTART')) {
          const dateStr = line.split(':')[1];
          if (dateStr) {
            const parsedDate = parseICalDate(dateStr);
            if (parsedDate) {
              currentEvent.start = parsedDate;
            }
          }
        } else if (line.startsWith('DTEND')) {
          const dateStr = line.split(':')[1];
          if (dateStr) {
            const parsedDate = parseICalDate(dateStr);
            if (parsedDate) {
              currentEvent.end = parsedDate;
            }
          }
        }
      } catch (error) {
        console.warn(`Error parsing iCal line ${i}:`, error);
        // Continue processing other lines
      }
    }
  }
  
  return events;
}

/**
 * Sanitize text content from iCal to prevent potential issues
 */
function sanitizeText(text: string): string {
  if (!text) return '';
  
  // Limit text length
  const trimmed = text.substring(0, 1000);
  
  // Decode iCal escape sequences
  return trimmed
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function parseICalDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  try {
    // Handle different iCal date formats
    if (dateStr.includes('T')) {
      // DateTime format: 20240101T120000Z or 20240101T120000
      const cleanDate = dateStr.replace(/[TZ]/g, '');
      
      // Validate format
      if (cleanDate.length < 8) {
        console.warn('Invalid iCal date format:', dateStr);
        return null;
      }
      
      const year = parseInt(cleanDate.substring(0, 4));
      const month = parseInt(cleanDate.substring(4, 6)) - 1;
      const day = parseInt(cleanDate.substring(6, 8));
      const hour = parseInt(cleanDate.substring(8, 10)) || 0;
      const minute = parseInt(cleanDate.substring(10, 12)) || 0;
      const second = parseInt(cleanDate.substring(12, 14)) || 0;
      
      // Validate parsed values
      if (isNaN(year) || isNaN(month) || isNaN(day) ||
          year < 1970 || year > 2100 ||
          month < 0 || month > 11 ||
          day < 1 || day > 31) {
        console.warn('Invalid date values:', dateStr);
        return null;
      }
      
      return new Date(year, month, day, hour, minute, second);
    } else {
      // Date only format: 20240101
      if (dateStr.length < 8) {
        console.warn('Invalid iCal date format:', dateStr);
        return null;
      }
      
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));
      
      // Validate parsed values
      if (isNaN(year) || isNaN(month) || isNaN(day) ||
          year < 1970 || year > 2100 ||
          month < 0 || month > 11 ||
          day < 1 || day > 31) {
        console.warn('Invalid date values:', dateStr);
        return null;
      }
      
      return new Date(year, month, day);
    }
  } catch (error) {
    console.warn('Error parsing iCal date:', dateStr, error);
    return null;
  }
}

/**
 * Validate a URL for calendar subscription
 * Only HTTPS URLs are allowed for security
 */
export function validateCalendarUrl(url: string): { valid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);
    
    if (urlObj.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTPS URLs are allowed for calendar subscriptions' };
    }
    
    // Block localhost and private IPs for security
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')) {
      return { valid: false, error: 'Private/local URLs are not allowed' };
    }
    
    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'Invalid URL format' };
  }
}
