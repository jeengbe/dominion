import { CallbackAbility, CardType, createCard } from '.';
import { AbilityTrigger } from '../ability';
import { Price, PriceType } from '../price';
import { AllCardSelector } from '../selector';

export const MoatCard = createCard({
  id: 'moat',
  cost: new Price({
    [PriceType.Coin]: 2,
  }),
  types: [CardType.Action, CardType.Reaction],
  abilities: {
    [AbilityTrigger.Play]: new CallbackAbility((context) => {
      context.getPlayer().drawCards(2);
    }),
    [AbilityTrigger.WhenPlay]: new CallbackAbility(async function (context) {
      if (!context.getCard().isType(CardType.Attack)) return;

      const owner = this.getOwner();
      if (!owner) {
        throw new Error('Cannot resolve ability of ownerless card');
      }

      const [promptedCard] = await owner.getClient().promptCardsBatch({
        from: [this],
        selector: new AllCardSelector(),
        min: 0,
        max: 1,
      });

      if (promptedCard) {
        await context.getPlayer().revealCards([promptedCard]);
        context.addUnaffected(owner);
      }
    }),
  },
});
