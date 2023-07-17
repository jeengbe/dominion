import { createTreasureOnlyCard } from '.';
import { Price, PriceType } from '../price';

export default createTreasureOnlyCard({
  id: 'silver',
  cost: new Price({
    [PriceType.Coin]: 3,
  }),
  coins: 2,
});
