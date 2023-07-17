import { Card, CardType } from './cards';

export class CardSelector {
  constructor(private readonly selector: (card: Card) => boolean) {}

  test(card: Card): boolean {
    return this.selector(card);
  }
}

export class AllCardSelector extends CardSelector {
  constructor() {
    super(() => true);
  }
}

export class TypeCardSelector extends CardSelector {
  constructor(cardTypes: CardType[]) {
    super((card) => cardTypes.some((cardType) => card.isType(cardType)));
  }
}
