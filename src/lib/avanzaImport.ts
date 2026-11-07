export interface AvanzaRow {
  type: "buy" | "sell";
  date: string;
  name: string;
  isin: string;
  shares: number;
  price: number;
  currency: string;
  fx: number;
  fees: number;
}

const num = (s: string | undefined) => {
  if (!s) return 0;
  const n = Number(s.replace(/\s|\u00a0/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
};

/** Parses Avanza "Transaktioner" CSV export (semicolon separated). Only buys and sells are kept. */
export function parseAvanzaCsv(text: string): AvanzaRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const head = lines[0].split(sep).map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const col = (...names: string[]) => head.findIndex((h) => names.some((n) => h.startsWith(n)));
  const iDate = col("datum"), iType = col("typ av transaktion", "typ"), iName = col("värdepapper", "vardepapper");
  const iQty = col("antal"), iPrice = col("kurs"), iAmt = col("belopp"), iFee = col("courtage");
  const iFx = col("valutakurs"), iCur = col("instrumentvaluta") >= 0 ? col("instrumentvaluta") : col("valuta");
  const iIsin = col("isin");
  const out: AvanzaRow[] = [];
  for (const line of lines.slice(1)) {
    const c = line.split(sep).map((x) => x.trim().replace(/^"|"$/g, ""));
    const t = (c[iType] || "").toLowerCase();
    const type = t.startsWith("köp") || t.startsWith("kop") ? "buy" : t.startsWith("sälj") || t.startsWith("salj") ? "sell" : null;
    if (!type) continue;
    const shares = Math.abs(num(c[iQty]));
    const price = Math.abs(num(c[iPrice]));
    if (!shares || !price) continue;
    const fees = Math.abs(num(c[iFee]));
    const currency = (c[iCur] || "SEK").toUpperCase() || "SEK";
    let fx = iFx >= 0 ? num(c[iFx]) : 0;
    if (!fx) {
      if (currency === "SEK") fx = 1;
      else {
        const amount = Math.abs(num(c[iAmt]));
        const gross = type === "buy" ? amount - fees : amount + fees;
        fx = amount ? gross / (shares * price) : 1;
      }
    }
    out.push({ type, date: (c[iDate] || "").slice(0, 10), name: c[iName] || "Okänd", isin: c[iIsin] || "", shares, price, currency, fx: Math.round(fx * 10000) / 10000, fees });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || (a.type === "buy" ? -1 : 1));
}
