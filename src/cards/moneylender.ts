import { createActionOnlyCard } from '.';
import { PromptCardTarget } from '../player';
import { Price, PriceType } from '../price';
import { CardSelector } from '../selector';

export default createActionOnlyCard({
  id: 'moneylender',
  cost: new Price({
    [PriceType.Coin]: 4,
  }),
  async onPlay(context) {
    const player = context.getPlayer();

    const [copper] = await player.getClient().promptCardsBatch({
      from: PromptCardTarget.Hand,
      selector: new CardSelector((card) => card.id === 'copper'),
      min: 0,
      max: 1,
    });

    if (copper) {
      await player.trashCardFromHand(copper);
    }
  },
});
