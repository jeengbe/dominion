import { createTreasureOnlyCard } from '.';
import { Price, PriceType } from '../price';

export default createTreasureOnlyCard({
  id: 'copper',
  cost: new Price({
    [PriceType.Coin]: 0,
  }),
  coins: 1,
});
