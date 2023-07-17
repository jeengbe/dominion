import { createVictoryOnlyCard } from '.';
import { Price, PriceType } from '../price';

export default createVictoryOnlyCard({
  id: 'gardens',
  cost: new Price({
    [PriceType.Coin]: 4,
  }),
  victoryPoints(card) {
    const owner = card.getOwner();
    if (!owner) {
      throw new Error('Cannot get Victory Points for ownerless Gardens card');
    }

    return Math.floor(owner.getDeck().length);
  },
});
