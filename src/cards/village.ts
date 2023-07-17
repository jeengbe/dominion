import { createActionOnlyCard } from '.';
import { Price, PriceType } from '../price';

export default createActionOnlyCard({
  id: 'village',
  cost: new Price({
    [PriceType.Coin]: 3,
  }),
  onPlay(context) {
    const player = context.getPlayer();
    const pool = player.getPool();

    player.drawCards(1);
    pool.addActions(2);
    pool.addBuys(1);
  },
});
