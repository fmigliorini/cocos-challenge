export type MoneyString = string; // e.g. "1234.56"
export type QuantityString = string; // e.g. "100"

export type PositionAggRow = {
  instrumentId: number;
  ticker: string;
  name: string;
  quantity: number; // Σ(BUY) - Σ(SELL)
  netCashFlow: MoneyString; // Σ(+SELL value) + Σ(-BUY value)
};

export type PriceRow = {
  instrumentId: number;
  close: MoneyString | null; // last close, or null
};

/** Public service views */
export type PositiionDetails = {
  ticker: string;
  name: string;

  qty: number; // remaining shares

  positionValue?: MoneyString; // qty * lastPrice (if price exists)
  totalReturnPct?: MoneyString; // based on net cash flow & lastPrice
};

export type PortfolioDetails = {
  // Cash
  availableCashAfterReserves: MoneyString; // available - reserved (not < 0)

  // Total account value = availableCash + market value of positions
  // (reserved cash is still part of the account balance)
  totalAccountValue: MoneyString;

  // Positions
  positions: PositiionDetails[];
};
