import { createActionOnlyCard } from '.';
import { GainTarget, PromptCardTarget } from '../player';
import { Price, PriceType } from '../price';
import { CardSelector } from '../selector';

export default createActionOnlyCard({
  id: 'workshop',
  cost: new Price({
    [PriceType.Coin]: 3,
  }),
  async onPlay(context) {
    const player = context.getPlayer();

    const [card] = await player.getClient().promptCardsBatch({
      from: PromptCardTarget.Supply,
      selector: new CardSelector((card) =>
        card.getCost().isLessThanOrEqual(
          new Price({
            [PriceType.Coin]: 4,
          })
        )
      ),
      min: 1,
      max: 1,
    });

    await player.gainCard(card, GainTarget.Discard);
  },
});
