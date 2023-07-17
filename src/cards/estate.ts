import { createVictoryOnlyCard } from '.';
import { Price, PriceType } from '../price';

export default createVictoryOnlyCard({
  id: 'estate',
  cost: new Price({
    [PriceType.Coin]: 2,
  }),
  victoryPoints: 1,
});
