import { createActionOnlyCard } from '.';
import { PromptCardTarget } from '../player';
import { Price, PriceType } from '../price';
import { CardSelector } from '../selector';

export default createActionOnlyCard({
  id: 'chapel',
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
        selector: new CardSelector((card) => player.mayTrashCard(card)),
        min: null,
        max: 4,
      });

    await player.trashCardFromHand(...cards);
  },
});
