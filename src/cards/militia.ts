import { CardType, createActionOnlyCard } from '.';
import { PromptCardTarget } from '../player';
import { Price, PriceType } from '../price';
import { AllCardSelector } from '../selector';

export default createActionOnlyCard({
  id: 'militia',
  cost: new Price({
    [PriceType.Coin]: 4,
  }),
  additionalTypes: [CardType.Attack],
  async onPlay(context) {
    const player = context.getPlayer();

    player.getPool().addCoins(2);

    for (const p of context.getKingdom().getPlayers()) {
      if (p === player) {
        continue;
      }
      if (context.getWhenPlayContext().getUnaffected().has(p)) {
        continue;
      }

      for await (const card of p.getClient().promptCardsStream({
        from: PromptCardTarget.Hand,
        selector: new AllCardSelector(),
        allowStop: false,
      })) {
        await p.discardCardFromHand(card);

        if (p.getHand().size <= 3) {
          break;
        }
      }
    }
  },
});
