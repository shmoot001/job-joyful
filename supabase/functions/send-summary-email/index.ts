import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SummaryRequest {
  type: 'daily' | 'weekly';
  date?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { type, date }: SummaryRequest = await req.json();
    
    // Get all users with profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    for (const profile of profiles) {
      const userId = profile.user_id;
      const userEmail = profile.email;
      
      if (!userEmail) continue;

      let emailContent = '';
      let subject = '';
      
      if (type === 'daily') {
        // Get tomorrow's data
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        // Get shifts for tomorrow
        const { data: shifts } = await supabase
          .from('shifts')
          .select(`
            *,
            jobs (name, hourly_rate, color)
          `)
          .eq('user_id', userId)
          .eq('date', tomorrowStr);
        
        // Get tasks due tomorrow
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('deadline', tomorrowStr)
          .eq('completed', false);
        
        subject = `Din dagliga sammanfattning för ${tomorrow.toLocaleDateString('sv-SE')}`;
        emailContent = generateDailyEmailContent(shifts || [], tasks || [], tomorrow);
        
      } else if (type === 'weekly') {
        // Get this week's data (Monday to Sunday)
        const today = new Date();
        const currentDay = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - currentDay + 1);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        const mondayStr = monday.toISOString().split('T')[0];
        const sundayStr = sunday.toISOString().split('T')[0];
        
        // Get shifts for the week
        const { data: shifts } = await supabase
          .from('shifts')
          .select(`
            *,
            jobs (name, hourly_rate, color)
          `)
          .eq('user_id', userId)
          .gte('date', mondayStr)
          .lte('date', sundayStr);
        
        // Get tasks for the week
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .gte('deadline', mondayStr)
          .lte('deadline', sundayStr);
        
        subject = `Din veckosammanfattning för vecka ${getWeekNumber(monday)}`;
        emailContent = generateWeeklyEmailContent(shifts || [], tasks || [], monday, sunday);
      }
      
      if (emailContent && userEmail) {
        await resend.emails.send({
          from: "Veckosammanfattning <onboarding@resend.dev>",
          to: [userEmail],
          subject,
          html: emailContent,
        });
        
        console.log(`Email sent to ${userEmail} for ${type} summary`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-summary-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateDailyEmailContent(shifts: any[], tasks: any[], date: Date): string {
  const dateStr = date.toLocaleDateString('sv-SE', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
        Din dagliga sammanfattning för ${dateStr}
      </h1>
  `;

  if (shifts.length > 0) {
    html += `
      <h2 style="color: #374151; margin-top: 30px;">🏢 Planerade pass</h2>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 10px 0;">
    `;
    
    shifts.forEach(shift => {
      const startTime = shift.start_time.slice(0, 5);
      const endTime = shift.end_time.slice(0, 5);
      const jobName = shift.jobs?.name || 'Okänt jobb';
      const hourlyRate = shift.jobs?.hourly_rate || 0;
      const hours = shift.hours || 0;
      const earnings = (hourlyRate * hours).toFixed(0);
      
      html += `
        <div style="background: white; padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 4px solid ${shift.jobs?.color || '#3B82F6'};">
          <strong>${jobName}</strong><br>
          <span style="color: #6b7280;">⏰ ${startTime} - ${endTime} (${hours}h)</span><br>
          <span style="color: #059669;">💰 ${earnings} kr</span>
          ${shift.notes ? `<br><em style="color: #6b7280;">${shift.notes}</em>` : ''}
        </div>
      `;
    });
    
    html += `</div>`;
  }

  if (tasks.length > 0) {
    html += `
      <h2 style="color: #374151; margin-top: 30px;">📋 Uppgifter att slutföra</h2>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 10px 0;">
    `;
    
    tasks.forEach(task => {
      html += `
        <div style="background: white; padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 4px solid #f59e0b;">
          <strong>${task.title}</strong>
          ${task.description ? `<br><span style="color: #6b7280;">${task.description}</span>` : ''}
          <br><span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${task.category}</span>
        </div>
      `;
    });
    
    html += `</div>`;
  }

  if (shifts.length === 0 && tasks.length === 0) {
    html += `
      <div style="text-align: center; padding: 40px; color: #6b7280;">
        <h3>🌟 Ingen planerad aktivitet imorgon!</h3>
        <p>Du har en fri dag framför dig.</p>
      </div>
    `;
  }

  html += `
      <div style="margin-top: 30px; padding: 15px; background: #eff6ff; border-radius: 8px; text-align: center;">
        <p style="color: #1e40af; margin: 0;">Ha en bra dag! 🌟</p>
      </div>
    </div>
  `;

  return html;
}

function generateWeeklyEmailContent(shifts: any[], tasks: any[], startDate: Date, endDate: Date): string {
  const weekStr = `${startDate.toLocaleDateString('sv-SE')} - ${endDate.toLocaleDateString('sv-SE')}`;
  
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
        Veckosammanfattning för ${weekStr}
      </h1>
  `;

  // Calculate totals
  const totalHours = shifts.reduce((sum, shift) => sum + (shift.hours || 0), 0);
  const totalEarnings = shifts.reduce((sum, shift) => {
    const rate = shift.jobs?.hourly_rate || 0;
    const hours = shift.hours || 0;
    return sum + (rate * hours);
  }, 0);

  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = tasks.filter(task => !task.completed).length;

  html += `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; text-align: center;">
        <h3 style="color: #1e40af; margin: 0 0 10px 0;">⏱️ Arbetstimmar</h3>
        <p style="font-size: 24px; font-weight: bold; color: #1e40af; margin: 0;">${totalHours}h</p>
      </div>
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center;">
        <h3 style="color: #166534; margin: 0 0 10px 0;">💰 Intjänat</h3>
        <p style="font-size: 24px; font-weight: bold; color: #166534; margin: 0;">${totalEarnings.toFixed(0)} kr</p>
      </div>
    </div>
  `;

  if (shifts.length > 0) {
    html += `<h2 style="color: #374151; margin-top: 30px;">🏢 Arbetade pass</h2>`;
    
    // Group shifts by day
    const shiftsByDay: { [key: string]: any[] } = {};
    shifts.forEach(shift => {
      const date = new Date(shift.date).toLocaleDateString('sv-SE', { weekday: 'long', month: 'short', day: 'numeric' });
      if (!shiftsByDay[date]) shiftsByDay[date] = [];
      shiftsByDay[date].push(shift);
    });

    Object.entries(shiftsByDay).forEach(([date, dayShifts]) => {
      html += `
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 10px 0;">
          <h3 style="color: #374151; margin: 0 0 10px 0;">${date}</h3>
      `;
      
      dayShifts.forEach(shift => {
        const startTime = shift.start_time.slice(0, 5);
        const endTime = shift.end_time.slice(0, 5);
        const jobName = shift.jobs?.name || 'Okänt jobb';
        const hours = shift.hours || 0;
        
        html += `
          <div style="background: white; padding: 10px; margin: 5px 0; border-radius: 6px; border-left: 4px solid ${shift.jobs?.color || '#3B82F6'};">
            <strong>${jobName}</strong> - ${startTime}-${endTime} (${hours}h)
          </div>
        `;
      });
      
      html += `</div>`;
    });
  }

  if (tasks.length > 0) {
    html += `
      <h2 style="color: #374151; margin-top: 30px;">📋 Uppgifter denna vecka</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 10px 0;">
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center;">
          <h4 style="color: #166534; margin: 0 0 5px 0;">✅ Slutförda</h4>
          <p style="font-size: 18px; font-weight: bold; color: #166534; margin: 0;">${completedTasks}</p>
        </div>
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
          <h4 style="color: #92400e; margin: 0 0 5px 0;">⏳ Återstående</h4>
          <p style="font-size: 18px; font-weight: bold; color: #92400e; margin: 0;">${pendingTasks}</p>
        </div>
      </div>
    `;
  }

  html += `
      <div style="margin-top: 30px; padding: 15px; background: #eff6ff; border-radius: 8px; text-align: center;">
        <p style="color: #1e40af; margin: 0;">Ha en fantastisk vecka framöver! 🌟</p>
      </div>
    </div>
  `;

  return html;
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

serve(handler);