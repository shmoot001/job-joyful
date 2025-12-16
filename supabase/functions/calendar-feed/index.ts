import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user_id from URL parameter (required for external calendar apps)
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      console.error('Missing user_id parameter');
      return new Response('Missing user_id parameter', { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('Invalid user_id format');
      return new Response('Invalid user_id format', { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    console.log(`Generating calendar feed for user: ${userId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role to bypass RLS since external calendar apps can't authenticate
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch shifts for the user
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('*, jobs(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(500);

    if (shiftsError) {
      console.error('Error fetching shifts:', shiftsError);
      return new Response('Error fetching shifts', { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    // Fetch tasks with deadlines for the user
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .not('deadline', 'is', null)
      .order('deadline', { ascending: false })
      .limit(500);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
    }

    console.log(`Found ${shifts?.length || 0} shifts and ${tasks?.length || 0} tasks`);

    // Generate iCal format
    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LifeHub Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:LifeHub Kalender',
      'X-WR-TIMEZONE:Europe/Stockholm',
    ];

    // Add shifts as events
    shifts?.forEach((shift: any) => {
      const startDateTime = `${shift.date.replace(/-/g, '')}T${shift.start_time.replace(/:/g, '')}`;
      const endDateTime = `${shift.date.replace(/-/g, '')}T${shift.end_time.replace(/:/g, '')}`;
      const jobName = shift.jobs?.name || 'Skift';
      const notes = shift.notes || '';
      
      icalContent.push(
        'BEGIN:VEVENT',
        `UID:shift-${shift.id}@lifehub`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${startDateTime}`,
        `DTEND:${endDateTime}`,
        `SUMMARY:${escapeICalText(jobName)}`,
        notes ? `DESCRIPTION:${escapeICalText(notes)}` : '',
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    // Add tasks as all-day events
    tasks?.forEach((task: any) => {
      const date = task.deadline.replace(/-/g, '');
      const completed = task.completed ? ' ✓' : '';
      
      icalContent.push(
        'BEGIN:VEVENT',
        `UID:task-${task.id}@lifehub`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${date}`,
        `SUMMARY:📋 ${escapeICalText(task.title)}${completed}`,
        task.description ? `DESCRIPTION:${escapeICalText(task.description)}` : '',
        task.category ? `CATEGORIES:${escapeICalText(task.category)}` : '',
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    icalContent.push('END:VCALENDAR');

    return new Response(icalContent.filter(line => line).join('\r\n'), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="lifehub-calendar.ics"',
      },
    });
  } catch (error) {
    console.error('Error generating calendar feed:', error);
    return new Response('Internal server error', { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }
});

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
