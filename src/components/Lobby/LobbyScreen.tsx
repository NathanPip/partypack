import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useOthersMapped, useSelf, useStorage } from "../../liveblocks.config";
import CAHGame from "../CAHGame/CAHGame";
import GameSelect from "./GameSelect";
import InviteButton from "./InviteButton";

const LobbyScreen: React.FC = () => {
  const title = useStorage((root) => root.name);
  const isHost = useSelf((me) => me.presence.isHost);
  const others = useOthersMapped((other) => other.presence.name);
  const currentGame = useStorage((root) => root.currentGame);
  const canPlay = useSelf((me) => me.presence.canPlay);

  const [playerContainer] = useAutoAnimate<HTMLDivElement>();

  if (currentGame && canPlay)
    return (
      <div className="relative h-screen w-full overflow-hidden">
        <CAHGame />
      </div>
    );

  return (
    <div className="relative max-w-7xl mx-auto">
      <InviteButton />
      <h1 className="mb-4 flex justify-center text-4xl">{title}</h1>
      {/* <p className="flex justify-end">{id}</p> */}
      <div className="max-w-xl mx-auto">
        <h2 className=" mt-8 mb-4 flex w-full  justify-center text-3xl">
          Players
        </h2>
          <div ref={playerContainer} className="shadow-inset p-4 flex flex-col items-center mx-2">
            {others.map((name) => (
              <div className="text-lg" key={name[0]}>
                {name[1]}
              </div>
            ))}
        </div>
      </div>
      {isHost ? <GameSelect name="Cards Against Humanity"></GameSelect> : <h2 className="text-center text-3xl mt-10 font-semibold drop-shadow-lg">Host is taking his time</h2>}
    </div>
  );
};

export default LobbyScreen;
