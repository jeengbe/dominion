import { AbilityTrigger, AbilityTriggerContexts } from '../ability';
import { Player } from '../player';
import { Price } from '../price';
import { MaybePromise } from '../utils';

export abstract class Card {
  abstract readonly id: string;
  abstract getCost(): Price;
  protected owner: Player | null = null;

  abstract getAbility<T extends AbilityTrigger>(
    trigger: T
  ): Ability<AbilityTriggerContexts[T]> | null;

  abstract isType(cardType: CardType): boolean;

  abstract getVictoryPoints(): number;

  setOwner(owner: Player | null): void {
    this.owner = owner;
  }

  getOwner(): Player | null {
    return this.owner;
  }
}

export abstract class Ability<Context = unknown> {
  abstract resolve(card: Card, context: Context): MaybePromise<void>;
}

export class CallbackAbility<Context> extends Ability<Context> {
  constructor(
    private readonly onPlay: (
      this: Card,
      context: Context
    ) => void | Promise<void>
  ) {
    super();
  }

  override async resolve(card: Card, context: Context): Promise<void> {
    return await this.onPlay.call(card, context);
  }
}

export class TreasureAbility extends Ability<{ getPlayer(): Player }> {
  constructor(private readonly coin: number) {
    super();
  }

  override resolve(card: Card): void {
    const owner = card.getOwner();
    if (!owner) {
      throw new Error('Cannot play ownerless Treasure card');
    }

    owner.getPool().addCoins(this.coin);
  }
}

export function createCard({
  id,
  cost,
  types,
  abilities,
  getVictoryPoints,
}: {
  id: string;
  cost: Price;
  types: CardType[];
  abilities?: {
    [K in AbilityTrigger]?: Ability<AbilityTriggerContexts[K]>;
  };
  getVictoryPoints?(card: Card): number;
}): new () => Card {
  return class extends Card {
    override readonly id = id;

    override getCost(): Price {
      return cost;
    }

    override isType(cardType: CardType): boolean {
      return types.includes(cardType);
    }

    override getAbility<T extends AbilityTrigger>(
      trigger: T
    ): Ability<AbilityTriggerContexts[T]> | null {
      return abilities?.[trigger] ?? null;
    }

    override getVictoryPoints(): number {
      return getVictoryPoints?.(this) ?? 0;
    }
  };
}

export function createActionOnlyCard({
  id,
  cost,
  additionalTypes,
  onPlay,
}: {
  id: string;
  cost: Price;
  additionalTypes?: CardType[];
  onPlay(
    context: AbilityTriggerContexts[AbilityTrigger.Play]
  ): MaybePromise<void>;
}): new () => Card {
  return createCard({
    id,
    cost,
    types: [CardType.Action, ...(additionalTypes ?? [])],
    abilities: {
      [AbilityTrigger.Play]: new CallbackAbility(onPlay),
    },
  });
}

export function createTreasureOnlyCard({
  id,
  cost,
  coins,
}: {
  id: string;
  cost: Price;
  coins: number;
}): new () => Card {
  return createCard({
    id,
    cost,
    types: [CardType.Treasure],
    abilities: {
      [AbilityTrigger.Play]: new TreasureAbility(coins),
    },
  });
}

export function createVictoryOnlyCard({
  id,
  cost,
  victoryPoints,
}: {
  id: string;
  cost: Price;
  victoryPoints: number | ((card: Card) => number);
}): new () => Card {
  return createCard({
    id,
    cost,
    types: [CardType.Victory],
    getVictoryPoints(card) {
      if (typeof victoryPoints === 'number') {
        return victoryPoints;
      }

      return victoryPoints(card);
    },
  });
}

export enum CardType {
  Action,
  Treasure,
  Victory,
  Reaction,
  Curse,
  Attack,
  Duration,
  Ruins,
  Traveller,
  Reserve,
  Night,
  Caste,
  Doom,
  Fate,
  Gathering,
  Heirloom,
  Knight,
  Looter,
  Prize,
  Shelter,
  Spirit,
  Zombie,
}

export enum CardFace {
  Up,
  Down,
}

export abstract class EventCard extends Card {}
