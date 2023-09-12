import { Card, CardType } from './cards';

export interface CardSelector {
  test(card: Card): boolean;
}

export class AllCardSelector implements CardSelector {
  test(): boolean {
    return true;
  }
}

export class TypeCardSelector implements CardSelector {
  constructor(private readonly cardTypes: CardType[]) {}

  test(card: Card): boolean {
    return this.cardTypes.some((cardType) => card.isType(cardType));
  }
}
