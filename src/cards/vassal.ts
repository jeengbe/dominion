import { CardType, createActionOnlyCard } from '.';
import { Price, PriceType } from '../price';
import { TypeCardSelector } from '../selector';

export default createActionOnlyCard({
  id: 'vassal',
  cost: new Price({
    [PriceType.Coin]: 3,
  }),
  async onPlay(context) {
    const player = context.getPlayer();

    player.getPool().addCoins(2);

    const topDeckCard = player.getDeck().pop();

    if (topDeckCard) {
      const [cardSelected] = await player.getClient().promptCardsBatch({
        from: [topDeckCard],
        selector: new TypeCardSelector([CardType.Action]),
        min: 0,
        max: 1,
      });

      if (cardSelected) {
        await player.playCard(cardSelected);
      } else {
        await player.discardCard(topDeckCard);
      }
    }
  },
});
