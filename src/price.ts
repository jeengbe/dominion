import { Pool } from './player';

export class Price {
  constructor(
    private readonly prices: {
      [K in PriceType]?: number;
    }
  ) {}

  private get(priceType: PriceType) {
    return this.prices[priceType] ?? 0;
  }

  getCoin(): number {
    return this.get(PriceType.Coin);
  }

  canBeBoughtWith(pool: Pool): boolean {
    if (this.get(PriceType.Coin) > pool.getCoins()) return false;

    return true;
  }

  isLessThanOrEqual(_price: Price): boolean {
    // TODO: Implement
    throw new Error('Not implemented');
  }
}

export enum PriceType {
  Coin,
}
