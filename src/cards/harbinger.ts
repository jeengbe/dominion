import { createActionOnlyCard } from '.';
import { PromptCardTarget } from '../player';
import { Price, PriceType } from '../price';
import { CardSelector } from '../selector';

export default createActionOnlyCard({
  id: 'harbinger',
  cost: new Price({
    [PriceType.Coin]: 3,
  }),
  async onPlay(context) {
    const player = context.getPlayer();

    player.drawCards(1);
    player.getPool().addActions(1);

    const [card] = await context
      .getPlayer()
      .getClient()
      .promptCardsBatch({
        from: PromptCardTarget.Discard,
        selector: new CardSelector((card) => player.mayDiscardCard(card)),
        min: 0,
        max: 1,
      });

    if (card) {
      player.getDiscardPile().remove(card);
      player.getDeck().push(card);
    }
  },
});
