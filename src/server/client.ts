import { v, validate } from 'vality';
import { WebSocket } from 'ws';
import { Card } from '../cards';
import {
  Player,
  PromptBatchOptions,
  PromptCardTarget,
  PromptStreamOptions,
} from '../player';
import {
  ClientMessage,
  ClientMessageType,
  ServerMessage,
  ServerMessageType,
} from '../protocol';

export class Client {
  private player: Player | null = null;

  constructor(private readonly socket: Socket) {}

  setPlayer(player: Player | null): void {
    this.player = player;
  }

  async promptCardsBatch(
    options: PromptBatchOptions
  ): Promise<readonly Card[]> {
    this.socket.send(ServerMessageType.PromptCards);

    const cards = await new Promise<readonly Card[]>((resolve) => {
      this.socket.once(ClientMessageType.PromptCardsResponse, (data) => {
        if (!this.player) throw new Error('Player not set');

        switch (options.from) {
          case PromptCardTarget.Supply: {
            if (data.pileIds === null) throw new Error('No pile IDs returned');
            if (data.cardIds !== null) {
              throw new Error('Card IDs returned when pile IDs were expected');
            }

            const supply = this.player.getKingdom().getSupply();

            const pileDigIndex: Map<string, number> = new Map();

            return resolve(
              data.pileIds.map((pileId) => {
                const pile = supply.get(pileId);
                if (!pile) throw new Error('Pile not found');

                const card = pile.at(pileDigIndex.get(pileId) ?? 0);
                if (!card) throw new Error('Not enough cards in pile');

                pileDigIndex.set(pileId, (pileDigIndex.get(pileId) ?? 0) + 1);

                return card;
              })
            );
          }
          case PromptCardTarget.Hand:
          case PromptCardTarget.Play:
          case PromptCardTarget.Discard:
          case PromptCardTarget.Deck:
          default: {
            if (data.pileIds !== null) {
              throw new Error('Pile IDs returned when card IDs were expected');
            }
            if (data.cardIds === null) throw new Error('No card IDs returned');

            if (new Set(data.cardIds).size !== data.cardIds.length) {
              throw new Error('Duplicate card IDs returned');
            }

            const set =
              options.from === PromptCardTarget.Hand
                ? this.player.getHand()
                : options.from === PromptCardTarget.Play
                ? this.player.getPlayArea()
                : options.from === PromptCardTarget.Discard
                ? this.player.getDiscardPile()
                : options.from === PromptCardTarget.Deck
                ? this.player.getDeck()
                : options.from;

            const setMap = new Map([...set].map((card) => [card.id, card]));

            return resolve(
              data.cardIds.map((cardId) => {
                const card = setMap.get(cardId);
                if (!card) throw new Error('Card not found');

                return card;
              })
            );
          }
        }
      });
    });

    if (options.min !== null) {
      if (cards.length < options.min) {
        throw new Error('Not enough cards selected');
      }
    }

    if (options.max !== null) {
      if (cards.length > options.max) {
        throw new Error('Too many cards selected');
      }
    }

    for (const card of cards) {
      if (!options.selector.test(card)) {
        throw new Error('Invalid card selected');
      }
    }

    return cards;
  }

  async *promptCardsStream(
    options: PromptStreamOptions
  ): AsyncGenerator<Card, void, undefined> {
    while (true) {
      this.socket.send(ServerMessageType.PromptCards);

      const card = await new Promise<Card | null>((resolve) => {
        this.socket.once(ClientMessageType.PromptCardsResponse, (data) => {
          if (!this.player) throw new Error('Player not set');

          switch (options.from) {
            case PromptCardTarget.Supply: {
              if (data.pileIds === null)
                throw new Error('No pile IDs returned');
              if (data.cardIds !== null) {
                throw new Error(
                  'Card IDs returned when pile IDs were expected'
                );
              }

              const [pileId] = data.pileIds;
              if (pileId === undefined) throw new Error('No pile ID returned');

              if (pileId === null) return resolve(null);

              const pile = this.player.getKingdom().getSupply().get(pileId);
              if (!pile) throw new Error('Pile not found');
              if (pile.isEmpty()) throw new Error('Pile is empty');

              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Checked above
              return resolve(pile.getTop()!);
            }
            case PromptCardTarget.Hand:
            case PromptCardTarget.Play:
            case PromptCardTarget.Discard:
            case PromptCardTarget.Deck:
            default: {
              if (data.pileIds !== null) {
                throw new Error(
                  'Pile IDs returned when card IDs were expected'
                );
              }
              if (data.cardIds === null)
                throw new Error('No card IDs returned');

              const [cardId] = data.cardIds;
              if (cardId === undefined) throw new Error('No card ID returned');

              if (cardId === null) return resolve(null);

              const set =
                options.from === PromptCardTarget.Hand
                  ? this.player.getHand()
                  : options.from === PromptCardTarget.Play
                  ? this.player.getPlayArea()
                  : options.from === PromptCardTarget.Discard
                  ? this.player.getDiscardPile()
                  : options.from === PromptCardTarget.Deck
                  ? this.player.getDeck()
                  : options.from;

              const setMap = new Map([...set].map((card) => [card.id, card]));
              const card = setMap.get(cardId);

              if (!card) throw new Error('Card not found');

              return resolve(card);
            }
          }
        });
      });

      if (card === null) {
        if (!options.allowStop) {
          throw new Error('No card selected');
        }

        return;
      }

      if (!options.selector.test(card)) {
        throw new Error('Invalid card selected');
      }

      yield card;
    }
  }
}

type Callback = {
  callback: (data: ClientMessage['data']) => void;
  once: boolean;
};

export class Socket {
  private readonly callbacks: Map<ClientMessageType, Set<Callback>> = new Map();

  constructor(private readonly socket: WebSocket) {
    this.socket.on('message', (data) => {
      if (Array.isArray(data)) throw new Error('Malformed data');
      if (data instanceof ArrayBuffer) throw new Error('Malformed data');
      const rawMessage = JSON.parse(data.toString('utf-8'));

      const message = validateClientMessage(rawMessage);

      const callbacks = this.callbacks.get(message.type);

      if (callbacks) {
        if (!callbacks.size) {
          throw new Error('No callbacks registered for message type');
        }

        const once: Set<Callback> = new Set();

        for (const callback of callbacks) {
          callback.callback(message.data);
          if (callback.once) once.add(callback);
        }

        for (const callback of once) {
          callbacks.delete(callback);
        }
      }
    });
  }

  send<T extends ServerMessageType>(
    type: T,
    ...data: Extract<ServerMessage, { type: T }>['data'] extends never
      ? []
      : [Extract<ServerMessage, { type: T }>['data']]
  ): void {
    this.socket.send(
      JSON.stringify({
        type,
        data,
      })
    );
  }

  once<T extends ClientMessageType>(
    type: T,
    callback: (data: Extract<ClientMessage, { type: T }>['data']) => void
  ): (data: Extract<ClientMessage, { type: T }>['data']) => void {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, new Set());
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.callbacks.get(type)!.add({
      // @ts-expect-error -- FIXME
      callback,
      once: true,
    });

    // @ts-expect-error -- FIXME
    return callback;
  }

  on<T extends ClientMessageType>(
    type: T,
    callback: (data: Extract<ClientMessage, { type: T }>['data']) => void
  ): (data: Extract<ClientMessage, { type: T }>['data']) => void {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, new Set());
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.callbacks.get(type)!.add({
      // @ts-expect-error -- FIXME
      callback,
      once: false,
    });

    // @ts-expect-error -- FIXME
    return callback;
  }

  remove<T extends ClientMessageType>(
    type: T,
    callback: (data: Extract<ClientMessage, { type: T }>['data']) => void
  ): void {
    const callbacks = this.callbacks.get(type) ?? new Set();

    let cb: Callback | undefined;
    for (const c of callbacks) {
      if (c.callback === callback) {
        cb = c;
        break;
      }
    }
    if (!cb) return;

    callbacks.delete(cb);

    this.callbacks.set(type, callbacks);
  }
}

function validateClientMessage(message: unknown): ClientMessage {
  const validated = validate(
    [
      {
        type: ClientMessageType.ListLobbies,
        data: {
          offset: v.number,
        },
      },
      {
        type: ClientMessageType.SubscribeLobbyUpdates,
        data: {
          lobbyIds: [v.string],
        },
      },
      {
        type: ClientMessageType.UnsubscribeLobbyUpdates,
        data: {
          lobbyIds: [v.string],
        },
      },
      {
        type: ClientMessageType.CreateLobby,
        data: {
          name: v.string,
        },
      },
      {
        type: ClientMessageType.JoinLobby,
        data: {
          lobbyId: v.string,
        },
      },
      {
        type: ClientMessageType.PromptCardsResponse,
        data: {
          pileIds: [[v.string], null],
          cardIds: [[v.string], null],
        },
      },
    ] as const,
    message
  );

  if (!validated.valid) throw new Error('Invalid message');

  return validated.data;
}
