import { createActionOnlyCard } from '.';
import { GainTarget, PromptCardTarget } from '../player';
import { Price, PriceType } from '../price';
import { AllCardSelector, CardSelector } from '../selector';

export default createActionOnlyCard({
  id: 'remodel',
  cost: new Price({
    [PriceType.Coin]: 4,
  }),
  async onPlay(context) {
    const player = context.getPlayer();

    const [cardToTrash] = await context
      .getPlayer()
      .getClient()
      .promptCardsBatch({
        from: PromptCardTarget.Hand,
        selector: new AllCardSelector(),
        min: 1,
        max: 1,
      });

    if (cardToTrash) {
      await player.trashCardFromHand(cardToTrash);

      const [cardToGain] = await player.getClient().promptCardsBatch({
        from: PromptCardTarget.Supply,
        selector: new CardSelector((card) =>
          card.getCost().isLessThanOrEqual(
            new Price({
              [PriceType.Coin]: cardToTrash.getCost().getCoin() + 2,
            })
          )
        ),
        min: 1,
        max: 1,
      });

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Prompt from Supply only returns cards that have at least one card in supply
      context.getKingdom().getSupply().get(cardToGain.id)!.pop();
      await player.gainCard(cardToGain, GainTarget.Discard);
    }
  },
});
