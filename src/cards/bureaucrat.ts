import { CardType, createActionOnlyCard } from '.';
import { GainTarget, PromptCardTarget } from '../player';
import { Price, PriceType } from '../price';
import { TypeCardSelector } from '../selector';

export default createActionOnlyCard({
  id: 'bureaucrat',
  cost: new Price({
    [PriceType.Coin]: 4,
  }),
  additionalTypes: [CardType.Attack],
  async onPlay(context) {
    const player = context.getPlayer();

    const silverPile = context.getKingdom().getSupply().get('silver');
    if (!silverPile) {
      throw new Error('No Silver Pile in Kingdom');
    }

    const silverCard = silverPile.pop();
    if (silverCard) {
      await player.gainCard(silverCard, GainTarget.Discard);
    }

    for (const p of context.getKingdom().getPlayers()) {
      if (p === player) {
        continue;
      }
      if (context.getWhenPlayContext().getUnaffected().has(p)) {
        continue;
      }

      const [victoryCard] = await p.getClient().promptCardsBatch({
        from: PromptCardTarget.Hand,
        selector: new TypeCardSelector([CardType.Victory]),
        min: 1,
        max: 1,
      });

      if (victoryCard) {
        await p.revealCards([victoryCard]);
      } else {
        await p.revealCards([...p.getHand()]);
      }
    }
  },
});
