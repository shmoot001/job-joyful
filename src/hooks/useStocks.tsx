import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

const db = supabase as any;

export interface StockTrade { id: string; ticker: string; name: string | null; buy_date: string; shares: number; buy_price: number; currency: string; buy_fx_rate: number; fees: number; }
export interface StockSale { id: string; trade_id: string; sell_date: string; shares: number; sell_price: number; sell_fx_rate: number; fees: number; }
export interface StockTag { id: string; name: string; color: string; }
export interface StockTradeTag { id: string; trade_id: string; tag_id: string; }
export interface StockNote { id: string; ticker: string; content: string; note_date: string; }
export interface Watchlist { id: string; name: string; }
export interface WatchlistItem { id: string; watchlist_id: string; ticker: string; name: string | null; }

const TABLES = ["stock_trades", "stock_sales", "stock_tags", "stock_trade_tags", "stock_notes", "stock_watchlists", "stock_watchlist_items"] as const;

export function useStocks() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["stocks", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await Promise.all(TABLES.map((t) => t === "stock_trade_tags" ? db.from(t).select("*") : db.from(t).select("*").order("created_at", { ascending: true })));
      res.forEach((r: any) => { if (r.error) throw r.error; });
      const num = (rows: any[]) => rows.map((r) => {
        const o: any = { ...r };
        ["shares", "buy_price", "buy_fx_rate", "fees", "sell_price", "sell_fx_rate"].forEach((k) => { if (o[k] != null) o[k] = Number(o[k]); });
        return o;
      });
      return {
        trades: num(res[0].data) as StockTrade[],
        sales: num(res[1].data) as StockSale[],
        tags: res[2].data as StockTag[],
        tradeTags: res[3].data as StockTradeTag[],
        notes: res[4].data as StockNote[],
        watchlists: res[5].data as Watchlist[],
        watchlistItems: res[6].data as WatchlistItem[],
      };
    },
  });

  const run = async (fn: () => Promise<any>, msg?: string) => {
    const { error, data } = await fn();
    if (error) { toast({ title: "Fel", description: error.message, variant: "destructive" }); throw error; }
    if (msg) toast({ title: msg });
    qc.invalidateQueries({ queryKey: ["stocks", user?.id] });
    return data;
  };
  const uid = user?.id;

  return {
    isLoading,
    trades: data?.trades ?? [], sales: data?.sales ?? [], tags: data?.tags ?? [], tradeTags: data?.tradeTags ?? [],
    notes: data?.notes ?? [], watchlists: data?.watchlists ?? [], watchlistItems: data?.watchlistItems ?? [],
    addTrade: async (t: Omit<StockTrade, "id">, tagIds: string[]) => {
      const row = await run(() => db.from("stock_trades").insert({ ...t, user_id: uid }).select().single());
      if (tagIds.length) await run(() => db.from("stock_trade_tags").insert(tagIds.map((tag_id) => ({ tag_id, trade_id: row.id, user_id: uid }))));
      toast({ title: "Köp registrerat" });
    },
    updateTradeTags: async (tradeId: string, tagIds: string[]) => {
      await run(() => db.from("stock_trade_tags").delete().eq("trade_id", tradeId));
      if (tagIds.length) await run(() => db.from("stock_trade_tags").insert(tagIds.map((tag_id) => ({ tag_id, trade_id: tradeId, user_id: uid }))));
    },
    updateTrade: (id: string, t: Omit<StockTrade, "id">) =>
      run(() => db.from("stock_trades").update(t).eq("id", id), "Köp uppdaterat"),
    updateSale: (id: string, sale: Omit<StockSale, "id" | "trade_id">) =>
      run(() => db.from("stock_sales").update(sale).eq("id", id), "Försäljning uppdaterad"),
    deleteTrade: (id: string) => run(() => db.from("stock_trades").delete().eq("id", id), "Position borttagen"),
    addSale: (s: Omit<StockSale, "id">) => run(() => db.from("stock_sales").insert({ ...s, user_id: uid }), "Försäljning registrerad"),
    deleteSale: (id: string) => run(() => db.from("stock_sales").delete().eq("id", id), "Försäljning borttagen"),
    addTag: (name: string, color: string) => run(() => db.from("stock_tags").insert({ name, color, user_id: uid }), "Tagg skapad"),
    deleteTag: (id: string) => run(() => db.from("stock_tags").delete().eq("id", id)),
    addNote: (ticker: string, content: string, note_date: string) => run(() => db.from("stock_notes").insert({ ticker, content, note_date, user_id: uid }), "Anteckning sparad"),
    deleteNote: (id: string) => run(() => db.from("stock_notes").delete().eq("id", id)),
    addWatchlist: (name: string) => run(() => db.from("stock_watchlists").insert({ name, user_id: uid }), "Lista skapad"),
    renameWatchlist: (id: string, name: string) => run(() => db.from("stock_watchlists").update({ name }).eq("id", id)),
    deleteWatchlist: (id: string) => run(() => db.from("stock_watchlists").delete().eq("id", id), "Lista borttagen"),
    addWatchItem: (watchlist_id: string, ticker: string, name: string) => run(() => db.from("stock_watchlist_items").insert({ watchlist_id, ticker, name: name || null, user_id: uid })),
    removeWatchItem: (id: string) => run(() => db.from("stock_watchlist_items").delete().eq("id", id)),
  };
}
