import { Card } from './cards';

export class Pile extends Array<Card> {
  isEmpty(): boolean {
    return this.length === 0;
  }

  shuffle(): void {
    this.splice(
      0,
      this.length,
      ...this.map((card) => ({ card, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ card }) => card)
    );
  }

  clear(): void {
    this.splice(0, this.length);
  }

  remove(card: Card): void {
    const index = this.indexOf(card);
    if (index === -1) throw new Error('Card not in pile');

    this.splice(index, 1);
  }

  getTop(): Card | undefined {
    return this.at(-1);
  }
}
