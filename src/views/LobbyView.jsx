import {
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useParams } from "react-router-dom";
import { PageContext } from "../components/PageContextProvider";
import { useTranslation } from "../config/i18n";

import dayjs from "dayjs";

// helpers
import { idGenAlphabet } from "../helpers/idgen";
import { getPlaysetById, maximizePlayset } from "../helpers/playsets";

// icons
import { IoPersonRemoveSharp } from "react-icons/io5";
import { HiQrCode, HiUsers } from "react-icons/hi2";
import { BiError } from "react-icons/bi";
import { FiLink } from "react-icons/fi";

//components
import PlaysetDisplay, {
  PlayWithBuryToggle,
  WrongPlayerNumberPlayset,
} from "../components/playsets/PlaysetDisplay";
import { calculatePlaysetDisabled } from "../components/menus/ChoosePlaysetMenu";
import QRCodeMenu from "../components/menus/QRCodeMenu";
import Info from "../components/Info";
import { PlayerRow } from "../components/PlayerList";

// avatar
import Avatar, { genConfig } from "react-nice-avatar-vite-prod-fork";
import Controls from "../components/info/Controls";
import PlaysetsFilter from "../components/playsets/PlaysetsFilter";
import { BsCassetteFill, BsGearFill } from "react-icons/bs";
import { FaThumbsUp } from "react-icons/fa";
import { generateDefaultRounds } from "../helpers/game";
import toast from "react-hot-toast";
import RoundConfig from "../components/RoundConfig";
import { Helmet } from "react-helmet";
import { ToggleButton } from "../components/menus/GameInfoMenu";
import DescriptionBox from "../components/DescriptionBox";
import { DevModeBanner } from "./HomeView";
import supabase from "../supabase";

const ROUND_TABS = [
  {
    key: "recommended",
    value: "recommended",
    color: "#0019fd",
    icon: <FaThumbsUp className="text-base" />,
  },
  {
    key: "custom",
    value: "custom",
    color: "#27d62a",
    icon: <BsGearFill className="text-base" />,
  },
];

function LobbyView(props) {
  const [loading, setLoading] = useState(true);
  const [host, setHost] = useState(false);
  const [me, setMe] = useState(null);

  const { redirect, setMenu } = useContext(PageContext);
  const { t } = useTranslation();

  const { code } = useParams();

  useEffect(() => {
    if (!code) return redirect("/");
    if (localStorage.getItem(`game-${code}`)) setHost(true);
    const me = JSON.parse(localStorage.getItem(`player-${code}`));
    if (!me?.name) {
      setTimeout(() => redirect("/?c=" + code), 100); // redirects to join home
      return;
    }

    setMe(me);
    setLoading(false);
  }, [code]);

  function openQRCode() {
    setMenu(<QRCodeMenu href={window?.location?.href} code={code} />);
  }

  function copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success(t("link_copied"), {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    });
  }

  return (
    <div className="flex flex-col justify-start items-center w-full h-full overflow-hidden">
      <div className="absolute top-3 right-3 flex items-center gap-1 z-50">
        <div
          className="p-3 text-2xl hover:bg-white/10 rounded-full transition-all cursor-pointer"
          onClick={copyLink}
          title={t("copy_link")}
        >
          <FiLink />
        </div>
        <div
          className="p-3 text-3xl hover:bg-white/10 rounded-full transition-all cursor-pointer"
          onClick={openQRCode}
        >
          <HiQrCode />
        </div>
      </div>
      <div className="flex flex-col justify-start items-center text-title p-4 w-full">
        <a href="/" className="text-primary text-lg">
          KABOOM
        </a>
        <h1 className="text-secondary text-4xl skew font-extrabold">{code}</h1>
      </div>
      <div className="overflow-y-scroll overflow-x-hidden w-full scrollbar-hide flex flex-col items-center">
        {loading ? (
          <span className="loading loading-spinner" />
        ) : host ? (
          <HostLobby me={me} code={code} />
        ) : (
          <ClientLobby me={me} setMe={setMe} code={code} />
        )}
      </div>
    </div>
  );
}

function ClientLobby({ me, setMe, code }) {
  const { connectionErrorPrompt, redirect, setPrompt } =
    useContext(PageContext);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);

  const [ready, setReady] = useState(false);
  const [playerList, setPlayerList] = useState([]);
  const [playset, setPlayset] = useState();

  const [selectedRoundTabByHost, setSelectedRoundTabByHost] = useState(
    ROUND_TABS[0]?.value,
  );
  const [roundConfig, setRoundConfig] = useState(
    generateDefaultRounds(playerList?.length || 1),
  );

  const channel = useRef(null);

  const player_data = JSON.parse(localStorage.getItem("player-" + code));

  useEffect(() => {
    initSupabase();
  }, []);

  useEffect(() => {
    if (channel.current && me?.id) {
      channel.current.send({
        type: "broadcast",
        event: "client_action",
        payload: {
          intent: ready ? "ready" : "unready",
          payload: { id: me.id },
        },
      });
    }
  }, [ready, me?.id]);

  async function initSupabase() {
    const chan = supabase.channel(`lobby-${code}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channel.current = chan;

    chan
      .on("broadcast", { event: "lobby_sync" }, ({ payload }) => {
        if (payload?.players) setPlayerList(payload.players);
        if (payload?.playsetId) getPlayset(payload.playsetId);
        if (payload?.roundConfig) setRoundConfig(payload.roundConfig);
        if (payload?.selectedRoundTabValue) {
          setSelectedRoundTabByHost(
            ROUND_TABS.find(
              (t) => t?.value === payload.selectedRoundTabValue,
            ) || ROUND_TABS[0],
          );
        }
        setLoading(false);
      })
      .on("broadcast", { event: "joined_lobby" }, ({ payload }) => {
        if (payload?.myId && payload?.targetId === player_data?.id) {
          let newMe = { ...player_data, id: payload.myId };
          localStorage.setItem("player-" + code, JSON.stringify(newMe));
          setMe(newMe);
          setLoading(false);
        }
      })
      .on("broadcast", { event: "redirect" }, ({ payload }) => {
        if (payload?.to) {
          // If targetId is specified, only redirect that specific player
          if (payload?.targetId && payload.targetId !== me?.id) return;
          setTimeout(() => setPrompt(null), 300);
          setTimeout(() => {
            chan.unsubscribe();
            redirect(payload.to);
          }, 1000);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          chan.send({
            type: "broadcast",
            event: "client_action",
            payload: {
              intent: "join",
              payload: {
                name: player_data.name,
                id: player_data?.id,
                userId: player_data?.userId,
              },
            },
          });
        }
      });

    // Listen for Host reconnecting to resync presence
    chan.on("broadcast", { event: "client_action" }, ({ payload }) => {
      if (payload?.intent === "host_reconnected") {
        chan.send({
          type: "broadcast",
          event: "client_action",
          payload: {
            intent: "join",
            payload: {
              name: player_data.name,
              id: player_data?.id,
              userId: player_data?.userId,
            },
          },
        });

        // Resend ready state slightly after
        setTimeout(() => {
          chan.send({
            type: "broadcast",
            event: "client_action",
            payload: {
              intent: ready ? "ready" : "unready",
              payload: { id: player_data?.id },
            },
          });
        }, 500);
      }
    });
  }

  async function getPlayset(id) {
    if (id) {
      const playset =
        (await getPlaysetById(id, null)) ||
        (await getPlaysetById("00000000-0000-0000-0000-000000000000", null)) ||
        (await getPlaysetById("t0001", null));
      setPlayset(maximizePlayset(playset));
    }
  }

  function changeName() {
    localStorage.setItem(`player-${code}`, JSON.stringify({ id: me?.id }));
    redirect(`/?c=${code}`);
  }

  return !loading ? (
    <div className="flex flex-col justify-start items-center w-full">
      <Lobby me={me} players={playerList} code={code} />
      <div className="w-full max-w-2xl p-4 gap-2 flex flex-col justify-start items-center">
        <button
          className={
            "w-full btn text-title text-primary-content" +
            (ready ? " btn-success " : " btn-accent ")
          }
          onClick={() => setReady(!ready)}
        >
          {ready ? t("ready") : t("ready_up")}
        </button>
        <button
          className={"w-full btn text-title btn-ghost text-neutral"}
          onClick={() => changeName()}
        >
          {t("change_name")}
        </button>
        <button
          className="link font-bold clickable"
          onClick={() => {
            channel.current?.send({
              type: "broadcast",
              event: "client_action",
              payload: { intent: "leave", payload: { id: me?.id } },
            });
            redirect("/");
          }}
        >
          {t("leave")}
        </button>
      </div>
      <div className=" w-full max-w-2xl p-4 py-2 flex flex-col items-start mb-4">
        <h1 className="font-extrabold text-lg uppercase ">
          {t("selected_playset")}{" "}
          <span className=" font-extralight text-sm normal-case">
            {t("by_host")}
          </span>
        </h1>
        <p className="text-xs text-neutral-content/60 mb-1">
          💡 {t("click_cards_to_see_info")}
        </p>
        <PlaysetDisplay
          autoFetchInteractions
          forceOpen
          selected
          playset={playset}
        />
        <DescriptionBox description={playset?.description} />
      </div>
      <div className=" w-full max-w-2xl p-4 py-2 flex flex-col items-start -mt-4">
        <h1 className="font-extrabold text-lg uppercase ">
          {t("round_config")}{" "}
          <span className=" font-extralight text-sm normal-case">
            {t("by_host")}
          </span>
        </h1>
        <RoundConfig
          color={selectedRoundTabByHost?.color}
          roundConfig={roundConfig}
        />
      </div>
      <LobbyFooter />
    </div>
  ) : (
    <div className="flex flex-col justify-start items-center w-full">
      <span className="loading loading-spinner"></span>
      <a className="link font-bold clickable" href="/">
        {t("leave")}
      </a>
    </div>
  );
}

function HostLobby({ me, code }) {
  const {
    redirect,
    devMode,
    setPrompt,
    connectionErrorPrompt,
    setPageCover,
    user,
  } = useContext(PageContext);
  const { t } = useTranslation();

  const player_data = JSON.parse(localStorage.getItem("player-" + code));

  const [playersUpdated, setPlayersUpdated] = useState([]);
  const [startCondition, setStartCondition] = useState(false);

  const [playset, setPlayset] = useState(null);
  const playsetRef = useRef(playset);

  const [playWithBury, setPlayWithBury] = useState(false);

  const [recommendBury, setRecommendBury] = useState(false);

  const channel = useRef(null);

  const [wrongPlayerNumber, setWrongPlayerNumber] = useState(true);

  const players = useRef([{ name: player_data.name, id: "HOST", host: true }]);

  const [playerState, setPlayerState] = useState(players.current);
  const [arePlayersOffline, setArePlayersOffline] = useState(false);

  const lastSelectedRoundTab =
    localStorage.getItem("lastSelectedRoundTab") || ROUND_TABS[0]?.value;
  const [selectedRoundTab, setSelectedRoundTab] = useState(
    ROUND_TABS?.find((tab) => tab?.value === lastSelectedRoundTab) ||
      ROUND_TABS[0],
  );
  const selectedRoundTabRef = useRef(selectedRoundTab);

  const lastCustomRoundConfig =
    JSON.parse(localStorage.getItem("lastCustomRoundConfig")) ||
    generateDefaultRounds(players?.current?.length || 1);
  const [roundConfig, setRoundConfig] = useState(
    lastSelectedRoundTab === "custom"
      ? lastCustomRoundConfig
      : generateDefaultRounds(players?.current?.length || 1),
  );
  const roundConfigRef = useRef(roundConfig);

  const onRoundTabClick = useCallback(
    (tab) => {
      setSelectedRoundTab(tab);

      localStorage.setItem("lastSelectedRoundTab", tab?.value);

      if (tab?.value === "recommended") {
        setRoundConfig(generateDefaultRounds(players?.current?.length || 1));
      }

      if (tab?.value === "custom") {
        setRoundConfig(
          JSON.parse(localStorage.getItem("lastCustomRoundConfig")) ||
            generateDefaultRounds(players?.current?.length || 1),
        );
      }

      if (tab?.value === "playset") {
        // wip
      }
    },
    [setSelectedRoundTab],
  );

  useEffect(() => {
    roundConfigRef.current = roundConfig;
    selectedRoundTabRef.current = selectedRoundTab;

    if (selectedRoundTab?.value === "custom") {
      localStorage.setItem(
        "lastCustomRoundConfig",
        JSON.stringify(roundConfig),
      );
    }

    updateAllClients();
  }, [roundConfig, selectedRoundTab]);

  useEffect(() => {
    if (
      localStorage.getItem(`game-${code}`) &&
      JSON.parse(localStorage.getItem(`game-${code}`))?.game
    )
      return redirect(`/game/${code}`);
    initSupabase();
    getPlayset(
      localStorage.getItem("lastSelectedPlayset") ||
        "00000000-0000-0000-0000-000000000000",
    );
  }, []);

  useEffect(() => {
    playsetRef.current = playset;
    updateAllClients();
  }, [playset]);

  const updateRecommendedRounds = useCallback(() => {
    if (selectedRoundTab?.value === "recommended") {
      setRoundConfig(generateDefaultRounds(playerState?.length || 1));
    }
  }, [playerState, selectedRoundTab]);

  useEffect(() => {
    let ok = true;
    if (players.current.length < 3) ok = false;
    if (
      players.current.filter((p) => p.ready).length <
      players.current.length - 1
    )
      ok = false; // checks if everyone is ready
    // if (calculatePlaysetDisabled(playset, players.current.length)) ok = false;

    setStartCondition(devMode ? true : ok);

    setWrongPlayerNumber(
      calculatePlaysetDisabled(playset, players.current.length),
    );

    setRecommendBury(
      playset?.odd_card && playset?.odd_card?.id !== "drunk"
        ? false
        : (playset?.cards.filter((c) => c?.id !== "p001")?.length +
            (playset?.odd_card ? 1 : 0)) %
            2 !==
            players.current.length % 2,
    ); // filters out drunk card

    setPlayerState(players.current);

    var offlinePlayers =
      players?.current?.filter((p) => !p?.conn && p?.id !== "HOST") || [];
    setArePlayersOffline(offlinePlayers?.length > 0);

    updateRecommendedRounds();
  }, [playersUpdated, playset, devMode, updateRecommendedRounds]);

  useEffect(() => {
    setPlayWithBury(recommendBury || playset?.force_bury || false);
  }, [recommendBury]);

  async function initSupabase() {
    const chan = supabase.channel(`lobby-${code}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channel.current = chan;

    chan
      .on("broadcast", { event: "client_action" }, ({ payload: data }) => {
        const playerID = {
          value:
            data?.payload?.id ||
            idGenAlphabet(3, [players.current.map((p) => p.id)]),
        };

        switch (data?.intent) {
          case "join":
            addPlayer(
              playerID.value,
              data?.payload?.name,
              true,
              data?.payload?.userId,
            );
            chan.send({
              type: "broadcast",
              event: "joined_lobby",
              payload: { myId: playerID.value, targetId: data?.payload?.id },
            });
            updateAllClients();
            break;

          case "leave":
            removePlayer(data?.payload?.id || playerID.value);
            setPlayersUpdated([]);
            updateAllClients();
            break;

          case "ready":
            readyPlayer(data?.payload?.id, true);
            updateAllClients();
            break;
          case "unready":
            readyPlayer(data?.payload?.id, false);
            updateAllClients();
            break;
          default:
            break;
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          chan.send({
            type: "broadcast",
            event: "client_action",
            payload: { intent: "host_reconnected" },
          });
        }
      });
  }

  function readyPlayer(id, ready = true) {
    const newPlayers = players.current.map((p) =>
      p.id == id ? { ...p, ready } : p,
    );

    players.current = newPlayers;

    setPlayersUpdated([]);

    return newPlayers;
  }

  const addPlayer = useCallback(
    (id, name, isConnected, userId) => {
      if (players.current.filter((p) => p?.id === id)[0]) {
        players.current = players.current.map((p) =>
          p?.id === id
            ? { ...p, conn: isConnected, name: name ? name : p.name }
            : p,
        );
      } else players.current.push({ id, name, conn: isConnected, userId });

      updateRecommendedRounds();

      setPlayersUpdated([]);

      return players.current;
    },
    [playersUpdated, updateRecommendedRounds],
  );

  const removePlayer = useCallback(
    (id) => {
      const newPlayers = players.current.filter((p) => p.id !== id);

      players.current = newPlayers;

      setPlayersUpdated([]);

      updateRecommendedRounds();
    },
    [playersUpdated, updateRecommendedRounds],
  );

  const kickPlayer = useCallback(
    (id) => {
      const player = players.current.filter((p) => p.id == id)[0];
      channel.current?.send({
        type: "broadcast",
        event: "redirect",
        payload: { to: "/", targetId: id },
      });
      removePlayer(id);

      updateRecommendedRounds();
    },
    [playersUpdated, updateRecommendedRounds],
  );

  function updateAllClients() {
    channel.current?.send({
      type: "broadcast",
      event: "lobby_sync",
      payload: {
        players: players.current.map((p) => ({
          ...p,
          conn: p.conn ? true : false,
        })),
        playsetId: playsetRef.current?.id,
        roundConfig: roundConfigRef.current,
        selectedRoundTabValue:
          selectedRoundTabRef.current?.value || ROUND_TABS[0]?.value,
      },
    });
  }

  function redirectAllClients(to) {
    channel.current?.send({
      type: "broadcast",
      event: "redirect",
      payload: { to },
    });
  }

  const startGame = useCallback(() => {
    if (arePlayersOffline) {
      setPrompt({
        title: t("offline_players"),
        text: t("offline_desc"),
        onApprove: () => startIt(),
      });
    } else if (wrongPlayerNumber) {
      setPrompt({
        title: t("insufficient_players"),
        text: t("insufficient_desc"),
        onApprove: () => startIt(),
      });
    } else startIt();

    async function startIt() {
      setPrompt(null);

      localStorage.setItem(
        `game-${code}`,
        JSON.stringify({
          rounds: roundConfig,
          playsetId: playset.id,
          players: players.current.map((p) => ({
            ...p,
            conn: undefined,
            ready: undefined,
          })),
          playWithBury:
            (playWithBury || playset?.force_bury) && !playset.no_bury,
          created_at: dayjs().valueOf(),
          color_reveal: players?.current?.length > 10,
        }),
      );

      const player_ids =
        players?.current?.filter((p) => p.userId)?.map((p) => p.userId) || [];

      if (user?.id)
        await supabase.from("games_played").insert([
          {
            user_id: user?.id,
            playset_id: playset.id,
            player_count: players.current.length,
            player_ids,
            devmode: devMode,
          },
        ]);

      // addLastPlayedPlaysets(playset.id)

      redirectAllClients("/game/" + code);

      setTimeout(() => {
        channel.current?.unsubscribe();
        setPrompt(null);
        redirect("/game/" + code, { replace: true });
      }, 200);
    }
  }, [
    user?.id,
    devMode,
    playset,
    players.current,
    roundConfig,
    playWithBury,
    arePlayersOffline,
    wrongPlayerNumber,
  ]);

  function promptStartGame() {
    if (arePlayersOffline || wrongPlayerNumber) return startGame();
    setPrompt({
      title: t("are_you_sure"),
      text: t("dev_mode_desc"),
      onApprove: () => startGame(),
    });
  }

  function closeRoom() {
    redirectAllClients("/");
    localStorage.removeItem(`game-${code}`);
    channel.current?.unsubscribe();
    redirect("/", { replace: true });
  }

  async function getPlayset(id) {
    setPageCover(null);
    setPlayset(null);

    const playset =
      (await getPlaysetById(id, null, { refreshInBackground: true })) ||
      (await getPlaysetById("00000000-0000-0000-0000-000000000000")) ||
      (await getPlaysetById("t0001"));

    playsetRef.current = playset;

    setPlayset(maximizePlayset(playset));

    updateAllClients();

    localStorage.setItem("lastSelectedPlayset", id);
  }

  // Playsets
  function showAllPlaysets() {
    setPageCover({
      title: "PLAYSETS",
      element: (
        <PlaysetsFilter
          onPlaysetClick={(playset) =>
            getPlayset(playset?.id, null, { refreshInBackground: true })
          }
        />
      ),
      onClose: () => setPageCover(null),
    });
  }

  function addLastPlayedPlaysets(playset_id) {
    var array = [playset_id];
    const playsetsString = localStorage.getItem("last-played-playsets");
    if (playsetsString) {
      var playsets = JSON.parse(playsetsString);
      if (Array.isArray(playsets)) {
        playsets = playsets.filter((p) => p != playset_id); // remove duplicates
        array = [...array, ...playsets];
      }
    }

    var shortenedArray = array.slice(0, 20); // shortens array to be only 20 elements long

    localStorage.setItem(
      "last-played-playsets",
      JSON.stringify(shortenedArray),
    );
  }

  return (
    <div className="flex flex-col justify-start items-center w-full pb-24">
      <Lobby
        me={me}
        kickPlayer={kickPlayer}
        amHost
        players={playerState}
        arePlayersOffline={arePlayersOffline}
        code={code}
      />
      <div className="w-full max-w-2xl p-4 gap-2 flex flex-col justify-start items-center">
        {devMode && (
          <div className="pb-2 w-full">
            <DevModeBanner size="sm" noButton />
          </div>
        )}

        {playerState.length < 6 ? (
          <div className="text-error text-sm font-semibold flex items-center gap-2 -my-1">
            <BiError />
            <h4>{t("need_players")}</h4>
          </div>
        ) : startCondition ? (
          <></>
        ) : (
          <div className="text-error text-sm font-semibold flex items-center gap-2 -my-1">
            <BiError />
            <h4>{t("everyone_ready")}</h4>
          </div>
        )}

        <button
          onClick={devMode ? promptStartGame : startGame}
          className={
            "w-full btn  text-title" +
            (startCondition ? " btn-primary  " : " btn-disabled ")
          }
        >
          {t("start_game")}
        </button>
        <button
          className="link font-bold clickable"
          onClick={() => closeRoom()}
        >
          {t("close_game")}
        </button>
      </div>
      <div className=" w-full max-w-2xl p-4 py-2 flex flex-col items-start">
        <h1 className="font-extrabold text-lg uppercase flex items-center gap-2">
          {t("selected_playset")} <Info tooltip={t("playset_info")} />
        </h1>
        <p className="text-xs text-neutral-content/60 mb-1">
          💡 {t("click_cards_to_see_info")}
        </p>
        {wrongPlayerNumber && <WrongPlayerNumberPlayset />}
        <PlaysetDisplay
          autoFetchInteractions
          forceOpen
          selected
          onClick={() => showAllPlaysets()}
          playset={playset}
        />
        <DescriptionBox description={playset?.description} />
        <div className="mt-2" />
        <ToggleButton
          full
          checked={playWithBury && !playset?.no_bury}
          onChange={(a) => setPlayWithBury((bury) => !bury)}
          recommended={recommendBury}
          disabled={playset?.no_bury || playset?.force_bury}
        >
          <div className="flex items-center gap-1">
            <h1 className={"font-bold text uppercase "}>
              {t("play_with_bury")}{" "}
            </h1>
            <Info tooltip={t("rulebook_p12")} />
          </div>
        </ToggleButton>
        {/* <PlayWithBuryToggle recommendBury={recommendBury} bury={(playWithBury) && !playset?.no_bury} onChange={bury => setPlayWithBury(bury)} disabled={playset?.no_bury || playset?.force_bury} /> */}
      </div>

      <div className=" w-full max-w-2xl p-4 py-2 flex flex-col items-start">
        <h1 className="font-extrabold text-lg uppercase flex items-center gap-2">
          {t("round_options")}
          <Info tooltip={t("round_options_info")} />
        </h1>
        <div className=" flex items-center justify-center overflow-x-scroll scrollbar-hide w-full gap-2 mb-2 ">
          {ROUND_TABS.map((tab) => {
            const { key: tabKey, ...tabProps } = tab;
            return (
              <SelectTab
                key={tab.value}
                selected={selectedRoundTab?.value === tab?.value}
                onClick={() => onRoundTabClick(tab)}
                {...tabProps}
              >
                {t(tab?.key)}
              </SelectTab>
            );
          })}
        </div>

        <RoundConfig
          color={selectedRoundTab?.color}
          roundConfig={roundConfig}
          onAddRound={() => {
            setRoundConfig((roundConfig) => {
              const lastRound = roundConfig[roundConfig.length - 1];
              return [
                ...roundConfig,
                {
                  time: Math.ceil(lastRound?.time / 2),
                  hostages: Math.ceil(lastRound?.hostages / 2),
                },
              ];
            });
            setSelectedRoundTab(ROUND_TABS[1]);
          }}
          onHostagesChange={(value, index) => {
            const newValue = JSON.parse(value);
            setRoundConfig((roundConfig) =>
              roundConfig.map((r, i) =>
                i === index ? { ...r, hostages: newValue } : r,
              ),
            );
            setSelectedRoundTab(ROUND_TABS[1]);
          }}
          onTimeChange={(value, index) => {
            const newValue = JSON.parse(value);
            setRoundConfig((roundConfig) =>
              roundConfig.map((r, i) =>
                i === index ? { ...r, time: newValue } : r,
              ),
            );
            setSelectedRoundTab(ROUND_TABS[1]);
          }}
          onRowDelete={(index) => {
            setRoundConfig((roundConfig) => {
              if (roundConfig.length <= 1) {
                toast.error("You need at least one round!");
                return roundConfig;
              }
              return roundConfig.filter((r, i) => i !== index);
            });
            setSelectedRoundTab(ROUND_TABS[1]);
          }}
        />
      </div>

      <LobbyFooter />
    </div>
  );
}

function SelectTab({
  className,
  style,
  selected,
  children,
  color,
  onClick = () => {},
}) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: !selected ? "#00000010" : color + "20",
        borderColor: color,
        ...style,
      }}
      className={
        "w-full text-xs font-bold rounded-full h-10 flex items-center justify-center lg:text-base transition-all " +
        (selected ? " border-2 " : "") +
        className
      }
    >
      {children}
    </div>
  );
}

function Lobby({
  me,
  players = [],
  amHost,
  kickPlayer,
  arePlayersOffline,
  code,
}) {
  // playersUpdated is a work around to update players which are really a state

  return (
    <div className="w-full flex flex-col justify-start items-center">
      <Helmet>
        <title>Kaboom • Lobby • {code?.toUpperCase() || ""}</title>
        <meta name="title" content="Kaboom" />
        <meta
          name="description"
          content={`Kaboom: Join ${players?.[0]?.name ? players[0]?.name + "'s " : ""} game (${code?.toUpperCase()}) for an explosive time with your friends`}
        />
      </Helmet>
      <div className="bg-neutral flex items-center justify-center w-full">
        <div className="w-full max-w-2xl p-4 gap-4 flex flex-col justify-start items-center">
          {players.map((player, i) => (
            <PlayerRow
              showOnline={me?.id === "HOST"}
              showId={me?.id === "HOST" || player?.id === "HOST"}
              me={me}
              {...player}
              key={i}
              amHost={amHost}
              element={
                me?.id === "HOST" &&
                !player.host && (
                  <div className="grow flex justify-end items-center">
                    <button
                      className="clickable btn-ghost p-3 -mr-1 rounded-md skew "
                      onClick={() => kickPlayer(player?.id)}
                    >
                      <IoPersonRemoveSharp />
                    </button>
                  </div>
                )
              }
            />
          ))}
          {players.length < 6 &&
            [...Array(6 - players.length)].map((e, i) => (
              <EmptyPlayerRow key={i} />
            ))}
        </div>
      </div>
      {players?.length && (
        <div
          className={
            "w-full bg-neutral text-center font-extrabold text-title pb-4 flex items-center justify-center gap-2 " +
            (arePlayersOffline ? " text-accent " : " text-neutral-content ")
          }
        >
          {players?.length} <HiUsers size={22} />
        </div>
      )}
    </div>
  );
}

function EmptyPlayerRow({}) {
  // amHost is when the person looking at the screen is the host. host = is when the player who is rendered is a host
  return (
    <div className="bg-accent rounded-md h-12 skew p-2 pl-6 text-title font-extrabold text-sm w-full flex justify-between items-center"></div>
  );
}

function LobbyFooter() {
  const { t } = useTranslation();
  return (
    <>
      <div className="w-full max-w-2xl p-4 pb-4">
        <h1 className="text-lg font-extrabold uppercase">
          {t("controls_title")}
        </h1>
        <div className="border-neutral border-2 text-base-content p-3 rounded-lg">
          <Controls />
        </div>
      </div>
      <div className="w-full max-w-2xl p-4 pb-32">
        <h1 className="text-lg font-extrabold uppercase">
          {t("signaling_leadership")}
        </h1>
        <div
          className="border-neutral border-2 text-base-content p-3 rounded-lg bold-child-error"
          dangerouslySetInnerHTML={{ __html: t("leader_missing_notice") }}
        ></div>
      </div>
    </>
  );
}

export default LobbyView;
