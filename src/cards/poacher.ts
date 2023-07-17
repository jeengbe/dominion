import { createActionOnlyCard } from '.';
import { PromptCardTarget } from '../player';
import { Price, PriceType } from '../price';
import { AllCardSelector } from '../selector';

export default createActionOnlyCard({
  id: 'poacher',
  cost: new Price({
    [PriceType.Coin]: 4,
  }),
  async onPlay(context) {
    const player = context.getPlayer();

    player.drawCards(1);
    player.getPool().addActions(1);
    player.getPool().addCoins(1);

    const emptySupplyPiles = [
      ...context.getKingdom().getSupply().values(),
    ].reduce((acc, cur) => {
      if (cur.isEmpty()) {
        acc++;
      }

      return acc;
    }, 0);

    await player.discardCardFromHand(
      ...(await player.getClient().promptCardsBatch({
        from: PromptCardTarget.Hand,
        selector: new AllCardSelector(),
        min: emptySupplyPiles,
        max: emptySupplyPiles,
      }))
    );
  },
});
