import { createActionOnlyCard } from '.';
import { Price, PriceType } from '../price';

export default createActionOnlyCard({
  id: 'market',
  cost: new Price({
    [PriceType.Coin]: 5,
  }),
  onPlay(context) {
    const player = context.getPlayer();
    const pool = player.getPool();

    player.drawCards(1);
    pool.addActions(1);
    pool.addBuys(1);
    pool.addCoins(1);
  },
});
