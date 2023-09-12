import { Client } from './server/client';
import {
  AbilityTrigger,
  CardAbilityContext,
  GainAbilityContext,
  PlayAbilityContext,
  PlayerAbilityContext,
  WhenPlayAbilityContext,
} from './ability';
import { Card, CardType, EventCard } from './cards';
import { Kingdom } from './kingdom';
import { Pile } from './pile';
import { Price } from './price';
import { CardSelector, TypeCardSelector } from './selector';

export class Player {
  private discardPile: Pile = new Pile();

  private deck: Deck = new Deck(this.discardPile);
  private readonly hand: Set<Card> = new Set();
  private readonly playArea: Set<Card> = new Set();

  private readonly pool: Pool = new Pool();

  constructor(
    private readonly client: Client,
    private readonly kingdom: Kingdom
  ) {
    client.setPlayer(this);

    this.deck.push(...kingdom.getStartCards());
    this.deck.shuffle();

    this.drawCards(5);
  }

  getPool(): Pool {
    return this.pool;
  }

  getClient(): Client {
    return this.client;
  }

  getDeck(): Deck {
    return this.deck;
  }

  getDiscardPile(): Pile {
    return this.discardPile;
  }

  getHand(): Set<Card> {
    return this.hand;
  }

  getKingdom(): Kingdom {
    return this.kingdom;
  }

  getPlayArea(): Set<Card> {
    return this.playArea;
  }

  async startActionPhase(): Promise<void> {
    this.pool.setActions(1);
    this.pool.setBuys(1);
    this.pool.setCoins(0);

    await this.kingdom
      .getTriggers()
      .trigger(
        AbilityTrigger.StartOfTurn,
        new PlayerAbilityContext({ kingdom: this.kingdom, player: this })
      );

    for await (const card of this.client.promptCardsStream({
      from: PromptCardTarget.Hand,
      selector: new TypeCardSelector([CardType.Action]),
      allowStop: true,
    })) {
      await this.playCard(card);
      this.pool.removeActions(1);

      if (this.pool.getActions() === 0) {
        // Action pool empty
        break;
      }
    }

    await this.startBuyAPhase();
  }

  async startBuyAPhase(): Promise<void> {
    await this.kingdom
      .getTriggers()
      .trigger(
        AbilityTrigger.StartOfBuyPhase,
        new PlayerAbilityContext({ kingdom: this.kingdom, player: this })
      );

    for await (const card of this.client.promptCardsStream({
      from: PromptCardTarget.Hand,
      selector: new TypeCardSelector([CardType.Treasure]),
      allowStop: true,
    })) {
      await this.playCard(card);
    }

    await this.startBuyBPhase();
  }

  async startBuyBPhase(): Promise<void> {
    for await (const card of this.client.promptCardsStream({
      from: PromptCardTarget.Supply,
      selector: new CardSelector((card) =>
        card.getCost().canBeBoughtWith(this.pool)
      ),
      allowStop: true,
    })) {
      await this.buyCard(card);
      this.pool.removeBuys(1);

      if (this.pool.getBuys() === 0) {
        // Buy pool empty
        break;
      }
    }

    await this.kingdom
      .getTriggers()
      .trigger(
        AbilityTrigger.EndOfBuyPhase,
        new PlayerAbilityContext({ kingdom: this.kingdom, player: this })
      );

    await this.startCleanUpPhase();
  }

  async startCleanUpPhase(): Promise<void> {
    await this.kingdom
      .getTriggers()
      .trigger(
        AbilityTrigger.StartOfCleanUp,
        new PlayerAbilityContext({ kingdom: this.kingdom, player: this })
      );

    const discardFromPlay = async (card: Card): Promise<void> => {
      this.playArea.delete(card);
      await this.discardCard(card);
    };

    for await (const card of this.client.promptCardsStream({
      from: PromptCardTarget.Play,
      selector: new CardSelector((card) => this.mayDiscardCard(card)),
      allowStop: true,
    })) {
      await discardFromPlay(card);
    }

    const handCardsToDiscard = [...this.hand].filter((card) =>
      this.mayDiscardCard(card)
    ).length;

    await this.discardCardFromHand(
      ...(await this.client.promptCardsBatch({
        from: PromptCardTarget.Hand,
        selector: new CardSelector((card) => this.mayDiscardCard(card)),
        min: handCardsToDiscard,
        max: handCardsToDiscard,
      }))
    );

    for await (const card of this.client.promptCardsStream({
      from: PromptCardTarget.Play,
      selector: new CardSelector((card) => this.mayDiscardCard(card)),
      allowStop: false,
    })) {
      await discardFromPlay(card);
    }

    // TODO: Move cards that may not be discarded to the side

    // TODO: Other players clear their play area

    await this.kingdom
      .getTriggers()
      .trigger(
        AbilityTrigger.WhenWouldDraw,
        new PlayerAbilityContext({ kingdom: this.kingdom, player: this })
      );

    this.drawCards(5);

    await this.kingdom
      .getTriggers()
      .trigger(
        AbilityTrigger.WhenDraw,
        new PlayerAbilityContext({ kingdom: this.kingdom, player: this })
      );

    await this.kingdom
      .getTriggers()
      .trigger(
        AbilityTrigger.EndOfTurn,
        new PlayerAbilityContext({ kingdom: this.kingdom, player: this })
      );
  }

  async playCard(
    card: Card
  ): Promise<{ playAbilityContext: PlayAbilityContext }> {
    this.hand.delete(card);
    this.playArea.add(card);

    const whenPlayContext = new WhenPlayAbilityContext({
      kingdom: this.kingdom,
      player: this,
      card,
    });
    await this.kingdom
      .getTriggers()
      .trigger(AbilityTrigger.WhenPlay, whenPlayContext);

    await this.kingdom
      .getTriggers()
      .trigger(
        AbilityTrigger.WhenWouldResolve,
        new CardAbilityContext({ kingdom: this.kingdom, player: this, card })
      );

    const playAbilityContext = new PlayAbilityContext({
      kingdom: this.kingdom,
      player: this,
      card: card,
      whenPlayContext,
    });
    const ability = card.getAbility(AbilityTrigger.Play);

    if (!ability) {
      throw new Error('Expected played card to have Play ability');
    }
    await ability.resolve(card, playAbilityContext);

    await this.kingdom
      .getTriggers()
      .trigger(
        AbilityTrigger.AfterResolve,
        new CardAbilityContext({ kingdom: this.kingdom, player: this, card })
      );

    return { playAbilityContext };
  }

  async buyCard(card: Card): Promise<void> {
    await this.kingdom
      .getTriggers()
      .trigger(
        AbilityTrigger.WhenBuy,
        new CardAbilityContext({ kingdom: this.kingdom, player: this, card })
      );

    this.pool.processBuy(card.getCost());

    await this.gainCard(card, GainTarget.Discard);
  }

  async buyEvent(card: EventCard): Promise<void> {
    if (this.pool.getBuys() === 0) {
      throw new Error('Buy pool empty');
    }

    if (!card.getCost().canBeBoughtWith(this.pool)) {
      throw new Error('Card too expensive');
    }

    const context = new CardAbilityContext({
      kingdom: this.kingdom,
      player: this,
      card,
    });

    this.pool.processBuy(card.getCost());

    const ability = card.getAbility(AbilityTrigger.Buy);

    if (!ability) {
      throw new Error('Expected bought event card to have Buy ability');
    }
    await ability.resolve(card, context);
  }

  async gainCard(card: Card, gainTarget: GainTarget): Promise<void> {
    await this.kingdom.getTriggers().trigger(
      AbilityTrigger.WhenWouldGain,
      new GainAbilityContext({
        kingdom: this.kingdom,
        player: this,
        card,
        gainTarget,
      })
    );

    switch (gainTarget) {
      case GainTarget.Discard:
        this.discardPile.push(card);
        break;
      case GainTarget.Deck:
        this.deck.push(card);
        break;
      case GainTarget.Hand:
        this.hand.add(card);
        break;
    }

    await this.kingdom.getTriggers().trigger(
      AbilityTrigger.WhenGain,
      new GainAbilityContext({
        kingdom: this.kingdom,
        player: this,
        card,
        gainTarget,
      })
    );
  }

  async discardCard(card: Card): Promise<void> {
    this.discardPile.push(card);

    await this.kingdom
      .getTriggers()
      .trigger(
        AbilityTrigger.WhenDiscard,
        new CardAbilityContext({ kingdom: this.kingdom, player: this, card })
      );
  }

  private async trashCard(card: Card): Promise<void> {
    this.kingdom.getTrashPile().push(card);

    await this.kingdom
      .getTriggers()
      .trigger(
        AbilityTrigger.WhenTrash,
        new CardAbilityContext({ kingdom: this.kingdom, player: this, card })
      );
  }

  drawCards(cards: number): void {
    this.moveCardsFromDeck(cards, this.hand);
  }

  private moveCardsFromDeck(cards: number, destination: Set<Card>) {
    if (this.deck.length < cards) {
      this.discardPile.shuffle();
      this.deck.unshift(...this.discardPile);
      this.discardPile.clear();
    }

    for (let i = 0; i < cards; i++) {
      const card = this.deck.pop();
      if (!card) {
        break;
      }

      destination.add(card);
    }
  }

  mayDiscardCard(card: Card): boolean {
    if (card.isType(CardType.Duration)) {
      // TODO: Has set up ability that is not yet resolved
    }

    // TODO: Has played duration card to which the above applies

    return true;
  }

  mayTrashCard(_card: Card): boolean {
    // TODO: Trash conditions

    return true;
  }

  async discardCardFromHand(...cards: Card[]): Promise<void> {
    for (const card of cards) {
      this.hand.delete(card);
      await this.discardCard(card);
    }
  }

  async trashCardFromHand(...cards: Card[]): Promise<void> {
    for (const card of cards) {
      this.hand.delete(card);
      await this.trashCard(card);
    }
  }

  async revealCards(_cards: Card[]): Promise<void> {
    // TODO: this
  }
}

export class Deck extends Pile {
  constructor(private readonly discardPile: Pile) {
    super();
  }

  override pop(): Card | undefined {
    if (this.isEmpty()) {
      this.discardPile.shuffle();
      this.unshift(...this.discardPile);
      this.discardPile.clear();
    }

    return super.pop();
  }

  override getTop(): Card | undefined {
    if (this.isEmpty()) {
      this.discardPile.shuffle();
      this.unshift(...this.discardPile);
      this.discardPile.clear();
    }

    return super.getTop();
  }
}

export class Pool {
  private actions = 1;
  private buys = 1;
  private coins = 0;

  setActions(actions: number): void {
    this.actions = actions;
  }

  setBuys(buys: number): void {
    this.buys = buys;
  }

  setCoins(coins: number): void {
    this.coins = coins;
  }

  getActions(): number {
    return this.actions;
  }

  getBuys(): number {
    return this.buys;
  }

  getCoins(): number {
    return this.coins;
  }

  addActions(actions: number): void {
    this.actions += actions;
  }

  addBuys(buys: number): void {
    this.buys += buys;
  }

  addCoins(coins: number): void {
    this.coins += coins;
  }

  removeActions(actions: number): void {
    this.actions -= actions;
  }

  removeBuys(buys: number): void {
    this.buys -= buys;
  }

  removeCoins(coins: number): void {
    this.coins -= coins;
  }

  processBuy(price: Price): void {
    this.removeBuys(1);
    this.removeCoins(price.getCoin());
  }
}

export enum GainTarget {
  Deck,
  Hand,
  Discard,
}

export interface PromptOptions {
  from: PromptCardTarget | readonly Card[];
  selector: CardSelector;
}

export interface PromptBatchOptions extends PromptOptions {
  min: number | null;
  max: number | null;
}

export interface PromptStreamOptions extends PromptOptions {
  allowStop: boolean;
}

export enum PromptCardTarget {
  Supply,
  Hand,
  Play,
  /**
   * Also means looking through the discard pile
   */
  Discard,
  /**
   * Also means looking though the deck
   */
  Deck,
}
