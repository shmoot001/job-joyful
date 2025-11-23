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
    // Get user ID from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Missing authorization header', { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response('Unauthorized', { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    const userId = user.id;

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

    // Generate iCal format
    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Lovable Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Min Kalender',
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
        `UID:shift-${shift.id}@lovable-calendar`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${startDateTime}`,
        `DTEND:${endDateTime}`,
        `SUMMARY:${jobName}`,
        notes ? `DESCRIPTION:${notes}` : '',
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
        `UID:task-${task.id}@lovable-calendar`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${date}`,
        `SUMMARY:${task.title}${completed}`,
        task.description ? `DESCRIPTION:${task.description}` : '',
        task.category ? `CATEGORIES:${task.category}` : '',
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    icalContent.push('END:VCALENDAR');

    return new Response(icalContent.filter(line => line).join('\r\n'), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="calendar.ics"',
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