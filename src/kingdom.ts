import { Triggers } from './ability';
import { Card } from './cards';
import CopperCard from './cards/copper';
import EstateCard from './cards/estate';
import { Pile } from './pile';
import { Player } from './player';
import { Client } from './server/client';

export class Kingdom {
  private readonly supply: Map<string, Pile> = new Map();
  private readonly trashPile: Pile = new Pile();
  private readonly players: Player[] = [];
  private turnNumber: number | null = null;
  private readonly triggers = new Triggers();

  getTriggers(): Triggers {
    return this.triggers;
  }

  addSupply(pileId: string, pile: Pile): void {
    if (this.supply.has(pileId)) {
      throw new Error('Duplicate pile id');
    }

    this.supply.set(pileId, pile);
  }

  getSupply(): Map<string, Pile> {
    return this.supply;
  }

  getTrashPile(): Pile {
    return this.trashPile;
  }

  createPlayer(client: Client): Player {
    const player = new Player(client, this);

    this.players.push(player);

    return player;
  }

  removePlayer(player: Player): void {
    const playerIndex = this.players.indexOf(player);
    if (playerIndex !== -1) {
      throw new Error('Player not part of kingdom');
    }

    this.players.splice(playerIndex, 1);
  }

  getTurnNumber(): number | null {
    return this.turnNumber;
  }

  async startGame(): Promise<void> {
    if (this.players.length < 2) {
      throw new Error('Not enough players');
    }

    this.turnNumber = 0;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Just checked that we have > 1 players
    await this.players.at(0)!.startActionPhase();
  }

  getPlayers(): Player[] {
    throw new Error('Method not implemented.');
  }

  getStartCards(): Card[] {
    return [
      ...new Array(3).fill(null).map(() => new EstateCard()),
      ...new Array(7).fill(null).map(() => new CopperCard()),
    ];
  }
}
