import { LiveList } from "@liveblocks/client";
import { type MouseEvent, useEffect, useState } from "react";
import {
  useSelf,
  useMutation as liveblocksMutation,
  useStorage,
  useUpdateMyPresence,
  useBroadcastEvent
} from "../../liveblocks.config";
import WhiteCard from "./WhiteCard";

const PlayerDeck: React.FC = () => {
  const updatePresence = useUpdateMyPresence();
  const currentPlayerDrawing = useStorage(
    (root) => root.CAH.currentPlayerDrawing
  );
  const connectedPlayers = useStorage((root) => root.CAH.connectedPlayers);
  const whiteCards = useStorage((root) => root.CAH.whiteCards);
  const currentCardIndex = useStorage((root) => root.CAH.currentWhiteCardIndex);
  const whiteCardsPerPlayer = useStorage(
    (root) => root.CAH.options.whiteCardsPerPlayer
  );

  const broadcast = useBroadcastEvent();

  const selfId = useSelf((me) => me.id);

  const gameState = useStorage((root) => root.CAH.activeState);

  const isHost = useSelf((me) => me.presence.isHost);

  const [hand, setHand] = useState<{ text: string; id: string }[]>();

  const drawInitialCards = liveblocksMutation(
    async ({ storage }, nextPlayer: string | undefined) => {
      if (!currentCardIndex) throw new Error("No current card");
      const cardsPerPlayer = storage.get("CAH").get("options").get("whiteCardsPerPlayer");
      storage.get("CAH").set("currentWhiteCardIndex", currentCardIndex - cardsPerPlayer);
      storage.get("CAH").set("currentPlayerDrawing", nextPlayer);
    },
    [currentPlayerDrawing, selfId]
  );

  const dealWhites = liveblocksMutation(async ({ storage }) => {
    storage.get("CAH").set("activeState", "dealing whites");
  }, []);

  // Initial Draw BE CAREFUL
  useEffect(() => {
    if (
      !selfId ||
      !whiteCards ||
      !currentCardIndex ||
      !whiteCardsPerPlayer ||
      !connectedPlayers
    )
      return;
    if (gameState === "starting game") dealWhites();
    if (gameState === "dealing whites") {
      if (currentPlayerDrawing === selfId) {
        updatePresence({ currentAction: "drawing" });
        const hand = whiteCards.slice(
          currentCardIndex - whiteCardsPerPlayer - 1,
          currentCardIndex
        );
        console.log(hand);
        const nextPlayer =
          connectedPlayers[connectedPlayers.length - 1] !== selfId
            ? connectedPlayers[connectedPlayers.indexOf(selfId) + 1]
            : "";
        console.log("next player", nextPlayer);
        drawInitialCards(
          nextPlayer,
        );
        setHand(hand);
      }
    }
  }, [
    currentPlayerDrawing,
    selfId,
    whiteCards,
    currentCardIndex,
    whiteCardsPerPlayer,
    updatePresence,
    connectedPlayers,
    drawInitialCards,
    isHost,
    gameState,
    dealWhites,
    broadcast
  ]);

  useEffect(() => {
    if(!hand) return;
      updatePresence({ CAHWhiteCardIds: hand.map((card) => card.id) });
  }, [hand, updatePresence])

  return (
    <div className="p-4 bg-green-300">
      {hand &&
        hand.map((card) => (
          <WhiteCard card={card} type="hand" setHand={setHand} key={card.id}/>
        ))}
    </div>
  );
};

export default PlayerDeck;
