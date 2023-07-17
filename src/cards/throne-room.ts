import { CardType, createActionOnlyCard } from '.';
import { AbilityTrigger } from '../ability';
import { PromptCardTarget } from '../player';
import { Price, PriceType } from '../price';
import { TypeCardSelector } from '../selector';

export default createActionOnlyCard({
  id: 'throne_room',
  cost: new Price({
    [PriceType.Coin]: 5,
  }),
  async onPlay(context) {
    const player = context.getPlayer();

    const [card] = await context
      .getPlayer()
      .getClient()
      .promptCardsBatch({
        from: PromptCardTarget.Hand,
        selector: new TypeCardSelector([CardType.Action]),
        min: 0,
        max: 1,
      });

    if (card) {
      const { playAbilityContext } = await player.playCard(card);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Every Ability card has a Play ability
      await card
        .getAbility(AbilityTrigger.Play)!
        .resolve(card, playAbilityContext);
    }
  },
});
