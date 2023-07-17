import { createVictoryOnlyCard } from '.';
import { Price, PriceType } from '../price';

export default createVictoryOnlyCard({
  id: 'duchie',
  cost: new Price({
    [PriceType.Coin]: 5,
  }),
  victoryPoints: 3,
});
