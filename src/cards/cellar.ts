import { createActionOnlyCard } from '.';
import { PromptCardTarget } from '../player';
import { Price, PriceType } from '../price';
import { CardSelector } from '../selector';

export default createActionOnlyCard({
  id: 'cellar',
  cost: new Price({
    [PriceType.Coin]: 2,
  }),
  async onPlay(context) {
    const player = context.getPlayer();

    player.getPool().addActions(1);

    const cards = await context
      .getPlayer()
      .getClient()
      .promptCardsBatch({
        from: PromptCardTarget.Hand,
        selector: new CardSelector((card) => player.mayDiscardCard(card)),
        min: null,
        max: null,
      });

    await player.discardCardFromHand(...cards);
    player.drawCards(cards.length);
  },
});
