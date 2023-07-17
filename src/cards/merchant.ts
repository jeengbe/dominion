import { CallbackAbility, createActionOnlyCard } from '.';
import { AbilityTrigger, WhenPlayAbilityContext } from '../ability';
import { Price, PriceType } from '../price';

export default createActionOnlyCard({
  id: 'marchant',
  cost: new Price({
    [PriceType.Coin]: 3,
  }),
  onPlay(context) {
    const player = context.getPlayer();

    player.drawCards(1);
    player.getPool().addActions(1);

    const whenPlayAbility = new CallbackAbility<WhenPlayAbilityContext>(
      (context) => {
        context.getPlayer().getPool().addCoins(1);
      }
    );

    context
      .getKingdom()
      .getTriggers()
      .once(AbilityTrigger.WhenPlay, whenPlayAbility);

    context
      .getKingdom()
      .getTriggers()
      .once(AbilityTrigger.EndOfTurn, () =>
        context.getKingdom().getTriggers().remove(whenPlayAbility)
      );
  },
});
