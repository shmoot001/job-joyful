import { useState, useEffect } from "react";

export type WidgetId = 
  | "activeJobs" 
  | "tasks" 
  | "upcomingShifts" 
  | "monthlyEarnings"
  | "earningsChart"
  | "hoursChart"
  | "tasksByCategory"
  | "recentActivity"
  | "emailReports"
  | "quickActions";

export interface WidgetConfig {
  id: WidgetId;
  name: string;
  visible: boolean;
  order: number;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "activeJobs", name: "Aktiva Jobb", visible: true, order: 0 },
  { id: "tasks", name: "Uppgifter", visible: true, order: 1 },
  { id: "upcomingShifts", name: "Kommande Skift", visible: true, order: 2 },
  { id: "monthlyEarnings", name: "Denna Månad", visible: true, order: 3 },
  { id: "earningsChart", name: "Månadsintäkter (diagram)", visible: true, order: 4 },
  { id: "hoursChart", name: "Arbetstimmar (diagram)", visible: true, order: 5 },
  { id: "tasksByCategory", name: "Uppgifter per Kategori", visible: true, order: 6 },
  { id: "recentActivity", name: "Senaste Aktivitet", visible: true, order: 7 },
  { id: "emailReports", name: "Email Rapporter", visible: true, order: 8 },
  { id: "quickActions", name: "Snabbåtgärder", visible: true, order: 9 },
];

const STORAGE_KEY = "dashboard-widget-settings";

export const useDashboardSettings = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle new widgets
        const merged = DEFAULT_WIDGETS.map(defaultWidget => {
          const savedWidget = parsed.find((w: WidgetConfig) => w.id === defaultWidget.id);
          return savedWidget ? { ...defaultWidget, ...savedWidget } : defaultWidget;
        });
        return merged.sort((a, b) => a.order - b.order);
      }
    } catch (e) {
      console.error("Failed to load dashboard settings:", e);
    }
    return DEFAULT_WIDGETS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

  const toggleWidget = (id: WidgetId) => {
    setWidgets(prev => 
      prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w)
    );
  };

  const moveWidget = (id: WidgetId, direction: "up" | "down") => {
    setWidgets(prev => {
      const index = prev.findIndex(w => w.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newWidgets = [...prev];
      [newWidgets[index], newWidgets[newIndex]] = [newWidgets[newIndex], newWidgets[index]];
      return newWidgets.map((w, i) => ({ ...w, order: i }));
    });
  };

  const resetToDefaults = () => {
    setWidgets(DEFAULT_WIDGETS);
  };

  const isVisible = (id: WidgetId) => {
    return widgets.find(w => w.id === id)?.visible ?? true;
  };

  return {
    widgets,
    toggleWidget,
    moveWidget,
    resetToDefaults,
    isVisible,
  };
};
