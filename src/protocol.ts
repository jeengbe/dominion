export enum ClientMessageType {
  ListLobbies = 'LIST_LOBBIES',
  SubscribeLobbyUpdates = 'SUBSCRIBE_LOBBY_UPDATES',
  UnsubscribeLobbyUpdates = 'UNSUBSCRIBE_LOBBY_UPDATES',
  CreateLobby = 'CREATE_LOBBY',
  JoinLobby = 'JOIN_LOBBY',
  PromptCardsResponse = 'PROMPT_CARDS_RESPONSE',
}

export type ClientMessage =
  | {
      type: ClientMessageType.ListLobbies;
      data: {
        offset: number;
      };
    }
  | {
      type: ClientMessageType.SubscribeLobbyUpdates;
      data: {
        lobbyIds: readonly string[];
      };
    }
  | {
      type: ClientMessageType.UnsubscribeLobbyUpdates;
      data: {
        lobbyIds: readonly string[];
      };
    }
  | {
      type: ClientMessageType.CreateLobby;
      data: {
        name: string;
      };
    }
  | {
      type: ClientMessageType.JoinLobby;
      data: {
        lobbyId: string;
      };
    }
  | {
      type: ClientMessageType.PromptCardsResponse;
      data: {
        pileIds: readonly string[] | null;
        cardIds: readonly string[] | null;
      };
    };

export enum ServerMessageType {
  ListLobbies = 'LIST_LOBBIES',
  LobbyUpdate = 'LOBBY_UPDATE',
  LobbyDetails = 'LOBBY_DETAILS',
  LobbyClientAdd = 'LOBBY_CLIENT_ADD',
  LobbyClientRemove = 'LOBBY_CLIENT_REMOVE',
  LobbyClientUpdate = 'LOBBY_CLIENT_UPDATE',
  PromptCards = 'PROMPT_CARDS',
}

export type ServerMessage =
  | {
      type: ServerMessageType.ListLobbies;
      data: {
        lobbies: readonly {
          lobbyId: string;
          name: string;
          players: number;
        }[];
      };
    }
  | {
      type: ServerMessageType.LobbyUpdate;
      data: {
        lobby: {
          lobbyId: string;
          name?: string;
          players?: number;
        };
      };
    }
  | {
      type: ServerMessageType.LobbyDetails;
      data: {
        lobby: {
          lobbyId: string;
          visibility: LobbyVisibility;
          name: string;
          clients: readonly LobbyClient[];
        };
      };
    }
  | {
      type: ServerMessageType.LobbyClientAdd;
      data: {
        client: LobbyClient;
      };
    }
  | {
      type: ServerMessageType.LobbyClientRemove;
      data: {
        clientId: string;
      };
    }
  | {
      type: ServerMessageType.LobbyClientUpdate;
      data: {
        client: {
          clientId: string;
          name?: string;
        };
      };
    }
  | {
      type: ServerMessageType.PromptCards;
      data: never;
    };

export enum LobbyVisibility {
  Public = 'PUBLIC',
  Private = 'PRIVATE',
}

export type LobbyClient = {
  clientId: string;
  name: string;
};
