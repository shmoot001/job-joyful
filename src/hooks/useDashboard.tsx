import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DashboardStats {
  totalJobs: number;
  totalTasks: number;
  completedTasks: number;
  upcomingShifts: number;
  monthlyEarnings: number;
  weeklyHours: number;
}

export interface MonthlyEarning {
  month: string;
  earnings: number;
  hours: number;
}

export interface WeeklyShift {
  week: string;
  shifts: number;
  hours: number;
}

export interface TasksByCategory {
  category: string;
  total: number;
  completed: number;
}

export interface RecentActivity {
  id: string;
  type: "shift" | "task" | "job";
  description: string;
  timestamp: string;
  status?: string;
}

export const useDashboard = () => {
  const { user } = useAuth();

  const {
    data: stats,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get basic counts
      const [jobsResult, tasksResult, shiftsResult] = await Promise.all([
        supabase.from("jobs").select("id").eq("user_id", user.id),
        supabase.from("tasks").select("id, completed").eq("user_id", user.id),
        supabase.from("shifts").select("id, date").eq("user_id", user.id),
      ]);

      const totalJobs = jobsResult.data?.length || 0;
      const totalTasks = tasksResult.data?.length || 0;
      const completedTasks = tasksResult.data?.filter(t => t.completed).length || 0;
      
      const today = new Date();
      const upcomingShifts = shiftsResult.data?.filter(s => new Date(s.date) >= today).length || 0;

      // Get monthly earnings
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const { data: monthlyShifts } = await supabase
        .from("shifts")
        .select(`
          hours,
          jobs!inner(hourly_rate)
        `)
        .eq("user_id", user.id)
        .gte("date", `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt("date", `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      const monthlyEarnings = monthlyShifts?.reduce((sum, shift) => {
        return sum + (shift.hours || 0) * (shift.jobs?.hourly_rate || 0);
      }, 0) || 0;

      // Get weekly hours
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { data: weeklyShifts } = await supabase
        .from("shifts")
        .select("hours")
        .eq("user_id", user.id)
        .gte("date", oneWeekAgo.toISOString().split('T')[0]);

      const weeklyHours = weeklyShifts?.reduce((sum, shift) => sum + (shift.hours || 0), 0) || 0;

      return {
        totalJobs,
        totalTasks,
        completedTasks,
        upcomingShifts,
        monthlyEarnings,
        weeklyHours,
      } as DashboardStats;
    },
    enabled: !!user?.id,
  });

  const {
    data: monthlyEarnings,
    isLoading: monthlyLoading,
  } = useQuery({
    queryKey: ["monthly-earnings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from("shifts")
        .select(`
          date,
          hours,
          jobs!inner(hourly_rate)
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      const monthlyData: { [key: string]: { earnings: number; hours: number } } = {};

      data?.forEach((shift) => {
        const date = new Date(shift.date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { earnings: 0, hours: 0 };
        }
        
        const earnings = (shift.hours || 0) * (shift.jobs?.hourly_rate || 0);
        monthlyData[monthKey].earnings += earnings;
        monthlyData[monthKey].hours += shift.hours || 0;
      });

      return Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          earnings: Math.round(data.earnings),
          hours: Math.round(data.hours * 10) / 10,
        }))
        .slice(-6); // Last 6 months
    },
    enabled: !!user?.id,
  });

  const {
    data: weeklyShifts,
    isLoading: weeklyLoading,
  } = useQuery({
    queryKey: ["weekly-shifts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from("shifts")
        .select("date, hours")
        .eq("user_id", user.id)
        .gte("date", new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order("date", { ascending: true });

      const weeklyData: { [key: string]: { shifts: number; hours: number } } = {};

      data?.forEach((shift) => {
        const date = new Date(shift.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { shifts: 0, hours: 0 };
        }
        
        weeklyData[weekKey].shifts += 1;
        weeklyData[weekKey].hours += shift.hours || 0;
      });

      return Object.entries(weeklyData)
        .map(([week, data]) => ({
          week: new Date(week).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' }),
          shifts: data.shifts,
          hours: Math.round(data.hours * 10) / 10,
        }))
        .slice(-8); // Last 8 weeks
    },
    enabled: !!user?.id,
  });

  const {
    data: tasksByCategory,
    isLoading: tasksLoading,
  } = useQuery({
    queryKey: ["tasks-by-category", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from("tasks")
        .select("category, completed")
        .eq("user_id", user.id);

      const categoryData: { [key: string]: { total: number; completed: number } } = {};

      data?.forEach((task) => {
        const category = task.category || "Okategoriserade";
        if (!categoryData[category]) {
          categoryData[category] = { total: 0, completed: 0 };
        }
        categoryData[category].total += 1;
        if (task.completed) {
          categoryData[category].completed += 1;
        }
      });

      return Object.entries(categoryData).map(([category, data]) => ({
        category,
        total: data.total,
        completed: data.completed,
      }));
    },
    enabled: !!user?.id,
  });

  const {
    data: recentActivity,
    isLoading: activityLoading,
  } = useQuery({
    queryKey: ["recent-activity", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const activities: RecentActivity[] = [];

      // Get recent shifts
      const { data: shifts } = await supabase
        .from("shifts")
        .select(`
          id,
          date,
          created_at,
          jobs!inner(name)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      shifts?.forEach((shift) => {
        activities.push({
          id: shift.id,
          type: "shift",
          description: `Registrerade skift på ${shift.jobs?.name}`,
          timestamp: shift.created_at,
        });
      });

      // Get recent completed tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title, completed_at, updated_at")
        .eq("user_id", user.id)
        .eq("completed", true)
        .order("completed_at", { ascending: false })
        .limit(5);

      tasks?.forEach((task) => {
        activities.push({
          id: task.id,
          type: "task",
          description: `Slutförde "${task.title}"`,
          timestamp: task.completed_at || task.updated_at,
          status: "completed",
        });
      });

      // Get recent jobs
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      jobs?.forEach((job) => {
        activities.push({
          id: job.id,
          type: "job",
          description: `Skapade jobb "${job.name}"`,
          timestamp: job.created_at,
        });
      });

      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    },
    enabled: !!user?.id,
  });

  return {
    stats,
    monthlyEarnings,
    weeklyShifts,
    tasksByCategory,
    recentActivity,
    isLoading: statsLoading || monthlyLoading || weeklyLoading || tasksLoading || activityLoading,
  };
};