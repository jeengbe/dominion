import { createVictoryOnlyCard } from '.';
import { Price, PriceType } from '../price';

export default createVictoryOnlyCard({
  id: 'province',
  cost: new Price({
    [PriceType.Coin]: 8,
  }),
  victoryPoints: 6,
});
