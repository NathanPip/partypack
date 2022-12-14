import { type Card } from "../../types/game";
import WhiteCard from "./WhiteCard";
import {
  useBroadcastEvent,
  useMutation as liveblocksMutation,
  useSelf,
  useStorage,
} from "../../liveblocks.config";
import { useEffect, useState } from "react";
import WinnersText from "./WinnerText";

type PickedHandProps = {
  hand:
    | {
        readonly cards: readonly Readonly<Required<Card>>[];
        readonly playerId: string;
      }
    | { cards: Required<Card>[]; playerId: string };
  isJudgingHand?: boolean;
};

const PickedHand: React.FC<PickedHandProps> = ({ hand, isJudgingHand }) => {
  const gameState = useStorage((root) => root.CAH.activeState);
  const isTurn = useSelf((me) => me.presence.CAHturn);
  const broadcast = useBroadcastEvent();
  const [numRevealed, setNumRevealed] = useState(0);
  const [canMove, setCanMove] = useState(false);
  const [clicked, setClicked] = useState(
    isJudgingHand !== undefined ? isJudgingHand : false
  );
  const handsRevealed = useStorage((root) => root.CAH.handsRevealed);
  const connectedPlayersLength = useStorage(
    (root) => root.CAH.connectedPlayers.length
  );

  const chooseWinner = liveblocksMutation(
    async ({ storage, setMyPresence }, id: string) => {
      window.dispatchEvent(new CustomEvent("winner chosen", {detail: id}));
      storage.get("CAH").set("activeState", "ending round");
      const currentBlackCard = storage.get("CAH").get("currentBlackCard");
      const hand = storage
        .get("CAH")
        .get("cardsInRound")
        ?.filter((hand) => hand.playerId === id)[0];
      if (hand === undefined) throw new Error("No winning hand found");
      storage.get("CAH").set("cardsInRound", [hand]);
      broadcast({
        type: "judge",
        data: { id, card: currentBlackCard },
      } as never);
      setMyPresence({ currentAction: "waiting" });
    },
    []
  );

  const setJudging = liveblocksMutation(
    async ({ storage, self, setMyPresence }) => {
      storage.get("CAH").set("activeState", "waiting for judge");
      storage.get("CAH").set("handsRevealed", 0);
      const isTurn = self.presence.CAHturn;
      if (isTurn) {
        console.log("I am judge");
        setMyPresence({ currentAction: "judging" });
      }
    },
    []
  );

  const incrementHandsRevealedAmt = liveblocksMutation(async ({ storage }) => {
    const handsRevealed = storage.get("CAH").get("handsRevealed");
    console.log(handsRevealed);
    storage.get("CAH").set("handsRevealed", handsRevealed + 1);
  }, []);

  const handClickHandler = () => {
    if (gameState === "waiting for judge" && isTurn) {
      chooseWinner(hand.playerId);
    }
  };

  const nextClickHandler = () => {
    if (gameState === "judge revealing" && isTurn && !clicked) {
      if (handsRevealed === connectedPlayersLength - 2) {
        setJudging();
        setClicked(true);
        return;
      }
      console.log("clicked");
      incrementHandsRevealedAmt();
      broadcast({ type: "next card", id: hand.playerId });
      setClicked(true);
    }
  };
  useEffect(() => {
    if (numRevealed === hand.cards.length) {
      setCanMove(true);
    }
  }, [numRevealed, setCanMove, hand.cards.length]);

  return (
    <div
      onClick={handClickHandler}
      className={`${
        gameState !== "waiting for judge" && !isJudgingHand ? "min-w-full" : ""
      } ${
        (gameState === "waiting for players to draw" ||
          gameState === "ending round" ||
          gameState === "ready to start round") &&
        "absolute left-1/2 -translate-x-1/2"
      } relative flex justify-center gap-2`}
    >
      <button
        onClick={nextClickHandler}
        className={`${
          !canMove || clicked ? "hidden" : ""
        } absolute -bottom-12 text-2xl flex items-center bg-zinc-50 py-1 px-2 rounded-lg`}
      >
        Next Hand
      </button>
      {hand.cards.map((card) => {
        return (
          <WhiteCard
            key={card.id}
            card={card}
            type={isJudgingHand ? "toReveal" : "round"}
            isRevealed={isJudgingHand}
            setRevealedAmt={setNumRevealed}
          />
        );
      })}
    </div>
  );
};

export default PickedHand;
