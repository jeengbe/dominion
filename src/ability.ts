import { Ability, Card } from './cards';
import { Kingdom } from './kingdom';
import { GainTarget, Player } from './player';

export declare class Triggers {
  once<T extends AbilityTrigger>(
    trigger: T,
    ability:
      | Ability<AbilityTriggerContexts[T]>
      | ((context: AbilityTriggerContexts[T]) => void)
  ): void;
  remove(
    ability:
      | Ability
      | ((context: AbilityTriggerContexts[AbilityTrigger]) => void)
  ): void;
  trigger<T>(
    trigger: T,
    context: AbilityTriggerContexts[AbilityTrigger]
  ): Promise<void>;
}

export enum AbilityTrigger {
  /**
   * Triggered only for the card that is played
   */
  Play,
  /**
   * Triggered before a card is played
   */
  WhenPlay,
  /**
   * Triggered only for that card that is bought
   */
  Buy,
  /**
   * Triggered before a card is bought
   */
  WhenBuy,
  /**
   * Triggered when a turn starts (at the start of the Action phase)
   */
  StartOfTurn,
  /**
   * Triggered at the start of the Buy A phase
   */
  StartOfBuyPhase,
  /**
   * Triggered at the end of the Buy B phase
   */
  EndOfBuyPhase,
  /**
   * Triggered at the start of the Clean-Up phase
   */
  StartOfCleanUp,
  /**
   * Triggered before a card is drawn
   */
  WhenWouldDraw,
  /**
   * Triggered after a card was drawn
   */
  WhenDraw,
  /**
   * Triggered when a turn has ended
   */
  EndOfTurn,
  /**
   * Triggered before an ability is resolved
   */
  WhenWouldResolve,
  /**
   * Triggered after an ability was resolved
   */
  AfterResolve,
  /**
   * Triggered before a card is gained
   */
  WhenWouldGain,
  /**
   * Triggered after a card was gained
   */
  WhenGain,
  /**
   * Triggered after a card was discarded
   */
  WhenDiscard,
  /**
   * Triggered after a card was trashed
   */
  WhenTrash,
}

export type AbilityTriggerContexts = {
  [AbilityTrigger.Play]: PlayAbilityContext;
  [AbilityTrigger.WhenPlay]: WhenPlayAbilityContext;
  [AbilityTrigger.Buy]: CardAbilityContext;
  [AbilityTrigger.WhenBuy]: CardAbilityContext;
  [AbilityTrigger.StartOfTurn]: PlayerAbilityContext;
  [AbilityTrigger.StartOfBuyPhase]: PlayerAbilityContext;
  [AbilityTrigger.EndOfBuyPhase]: PlayerAbilityContext;
  [AbilityTrigger.StartOfCleanUp]: PlayerAbilityContext;
  [AbilityTrigger.WhenWouldDraw]: CardAbilityContext;
  [AbilityTrigger.WhenDraw]: CardAbilityContext;
  [AbilityTrigger.EndOfTurn]: PlayerAbilityContext;
  [AbilityTrigger.WhenWouldResolve]: AbilityResolveAbilityContext;
  [AbilityTrigger.AfterResolve]: AbilityResolveAbilityContext;
  [AbilityTrigger.WhenWouldGain]: GainAbilityContext;
  [AbilityTrigger.WhenGain]: GainAbilityContext;
  [AbilityTrigger.WhenDiscard]: CardAbilityContext;
  [AbilityTrigger.WhenTrash]: CardAbilityContext;
};

export class PlayerAbilityContext {
  private readonly kingdom: Kingdom;
  private readonly player: Player;

  constructor({ kingdom, player }: { kingdom: Kingdom; player: Player }) {
    this.kingdom = kingdom;
    this.player = player;
  }

  getKingdom(): Kingdom {
    return this.kingdom;
  }

  getPlayer(): Player {
    return this.player;
  }
}

export class CardAbilityContext extends PlayerAbilityContext {
  private readonly card: Card;

  constructor({
    kingdom,
    player,
    card,
  }: {
    kingdom: Kingdom;
    player: Player;
    card: Card;
  }) {
    super({
      kingdom,
      player,
    });

    this.card = card;
  }

  getCard(): Card {
    return this.card;
  }
}

export class PlayAbilityContext extends CardAbilityContext {
  private readonly whenPlayContext: WhenPlayAbilityContext;

  constructor({
    kingdom,
    player,
    card,
    whenPlayContext,
  }: {
    kingdom: Kingdom;
    player: Player;
    card: Card;
    whenPlayContext: WhenPlayAbilityContext;
  }) {
    super({
      kingdom,
      player,
      card,
    });

    this.whenPlayContext = whenPlayContext;
  }

  getWhenPlayContext(): WhenPlayAbilityContext {
    return this.whenPlayContext;
  }
}
export class WhenPlayAbilityContext extends CardAbilityContext {
  private readonly unaffected: Set<Player> = new Set();

  addUnaffected(player: Player): void {
    this.unaffected.add(player);
  }

  getUnaffected(): Set<Player> {
    return this.unaffected;
  }
}

export class AbilityResolveAbilityContext extends CardAbilityContext {
  private readonly ability: Ability;

  constructor({
    kingdom,
    player,
    card,
    ability,
  }: {
    kingdom: Kingdom;
    player: Player;
    card: Card;
    ability: Ability;
  }) {
    super({
      kingdom,
      player,
      card,
    });

    this.ability = ability;
  }

  getAbility(): Ability {
    return this.ability;
  }
}

export class GainAbilityContext extends CardAbilityContext {
  private readonly gainTarget: GainTarget;

  constructor({
    kingdom,
    player,
    card,
    gainTarget,
  }: {
    kingdom: Kingdom;
    player: Player;
    card: Card;
    gainTarget: GainTarget;
  }) {
    super({
      kingdom,
      player,
      card,
    });

    this.gainTarget = gainTarget;
  }

  getGainTarget(): GainTarget {
    return this.gainTarget;
  }
}
