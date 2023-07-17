import { createTreasureOnlyCard } from '.';
import { Price, PriceType } from '../price';

export default createTreasureOnlyCard({
  id: 'gold',
  cost: new Price({
    [PriceType.Coin]: 6,
  }),
  coins: 3,
});
