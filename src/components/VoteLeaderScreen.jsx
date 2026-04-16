import { useState, useMemo } from "react";
import { useTranslation } from "../config/i18n";
import Avatar, { genConfig } from "react-nice-avatar-vite-prod-fork";
import { FaCrown, FaVoteYea } from "react-icons/fa";
import { BsFillDoorOpenFill } from "react-icons/bs";
import "animate.css";

function VoteLeaderScreen({
  players = [],
  me,
  votes = {},
  execute,
  isHost,
  leaders = {},
  totalPlayerCount = 0,
}) {
  const { t } = useTranslation();

  // The player's actual room is fixed — they can only see their own room's voting
  const myRoom = me?.room || me?.startingRoom || 1;

  // Players in my room
  const roomPlayers = useMemo(() => {
    return players.filter((p) => p.room === myRoom);
  }, [players, myRoom]);

  // My vote (from server state)
  const myVote = useMemo(() => {
    return votes?.[me?.id] || null;
  }, [votes, me?.id]);

  // Vote counts per player in this room
  const voteCounts = useMemo(() => {
    const counts = {};
    roomPlayers.forEach((p) => {
      counts[p.id] = 0;
    });

    Object.entries(votes || {}).forEach(([voterId, candidateId]) => {
      // Only count votes from players in the same room
      const voter = players.find((p) => p.id === voterId);
      if (voter?.room === myRoom && counts[candidateId] !== undefined) {
        counts[candidateId]++;
      }
    });
    return counts;
  }, [votes, roomPlayers, players, myRoom]);

  // Who is leading in this room
  const leadingPlayerId = useMemo(() => {
    let maxVotes = 0;
    let leaderId = null;
    Object.entries(voteCounts).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        leaderId = id;
      }
    });
    return maxVotes > 0 ? leaderId : null;
  }, [voteCounts]);

  // Total votes across ALL rooms (for auto-confirm progress)
  const totalVotes = useMemo(() => {
    return Object.keys(votes || {}).length;
  }, [votes]);

  // Total votes in this room
  const totalRoomVotes = useMemo(() => {
    return Object.values(voteCounts).reduce((a, b) => a + b, 0);
  }, [voteCounts]);

  function handleVote(candidateId) {
    if (myVote === candidateId) {
      execute("retract-vote", [me?.id]);
    } else {
      execute("cast-vote", [me?.id, candidateId]);
    }
  }

  function handleConfirm() {
    execute("confirm-leaders", []);
  }

  function handleSkip() {
    execute("skip-vote", []);
  }

  const votedPlayerName = useMemo(() => {
    if (!myVote) return null;
    return players.find((p) => p.id === myVote)?.name || myVote;
  }, [myVote, players]);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center text-title text-white drop-shadow-md gap-0 text-center overflow-y-scroll overflow-hidden scrollbar-hide z-95"
      style={{
        background:
          "linear-gradient(145deg, #1a0533 0%, #0f0a2e 30%, #1b0c3a 60%, #2d1150 100%)",
      }}
    >
      {/* Floating orbs background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-64 h-64 rounded-full opacity-10 animate-pulse"
          style={{
            background: "radial-gradient(circle, #8b5cf6, transparent)",
            top: "-5%",
            left: "-10%",
          }}
        />
        <div
          className="absolute w-80 h-80 rounded-full opacity-10 animate-pulse"
          style={{
            background: "radial-gradient(circle, #a855f7, transparent)",
            bottom: "-10%",
            right: "-15%",
            animationDelay: "1s",
          }}
        />
        <div
          className="absolute w-40 h-40 rounded-full opacity-5 animate-pulse"
          style={{
            background: "radial-gradient(circle, #c084fc, transparent)",
            top: "40%",
            left: "60%",
            animationDelay: "2s",
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center pb-1 w-full">
        <div
          style={{ animationDelay: "0ms" }}
          className="animate__animated animate__bounceInDown flex items-center justify-center gap-3 mb-1"
        >
          <FaCrown
            className="text-amber-400 text-3xl drop-shadow-lg"
            style={{ filter: "drop-shadow(0 0 10px rgba(251, 191, 36, 0.5))" }}
          />
        </div>
        <h1
          style={{ animationDelay: "200ms" }}
          className="animate__animated animate__fadeInUp text-2xl tracking-wider uppercase font-extrabold"
        >
          {t("vote_leader")}
        </h1>
        <p
          style={{ animationDelay: "400ms" }}
          className="animate__animated animate__fadeInUp text-xs font-light text-white/50 mt-0.5"
        >
          {t("vote_instruction")}
        </p>
      </div>

      {/* Room Info */}
      <div
        style={{ animationDelay: "500ms" }}
        className="animate__animated animate__fadeInUp relative z-10 w-full max-w-lg px-4 mt-3 mb-2 flex items-center justify-center"
      >
        <div
          className={
            "rounded-xl py-2 px-6 flex items-center justify-center gap-2 font-bold text-sm backdrop-blur-sm shadow-lg " +
            (myRoom === 1
              ? "border-2 border-blue-400 bg-blue-500/20 text-white"
              : "border-2 border-rose-400 bg-rose-500/20 text-white")
          }
        >
          <BsFillDoorOpenFill className="text-base" />
          <span>
            {t("room")} {myRoom} {t("candidates")}
          </span>
        </div>
      </div>

      {/* Player Grid */}
      <div
        style={{ animationDelay: "700ms" }}
        className="animate__animated animate__fadeInUp relative z-10 w-full max-w-lg px-4 mt-1"
      >
        {roomPlayers.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-3">
            {roomPlayers.map((player, i) => {
              const isMe = player.id === me?.id;
              const isVoted = myVote === player.id;
              const isLeading = leadingPlayerId === player.id;
              const isCurrentLeader = leaders[myRoom] === player.id;
              const voteCount = voteCounts[player.id] || 0;

              return (
                <VoteCard
                  key={player.id}
                  player={player}
                  isMe={isMe}
                  isVoted={isVoted}
                  isLeading={isLeading}
                  isCurrentLeader={isCurrentLeader}
                  voteCount={voteCount}
                  onClick={() => handleVote(player.id)}
                  delay={700 + i * 60}
                  t={t}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-white/30 text-sm py-8">{t("no_votes_yet")}</div>
        )}
      </div>

      {/* Vote Status */}
      <div
        style={{ animationDelay: "1000ms" }}
        className="animate__animated animate__fadeInUp relative z-10 w-full max-w-lg px-5 mt-3"
      >
        {/* Vote count bar */}
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-white/40 mb-2">
          <FaVoteYea className="text-purple-400" />
          <span>
            {totalVotes} / {totalPlayerCount || players.length} {t("votes")}
          </span>
          {totalVotes >= (totalPlayerCount || players.length) && (
            <span className="text-green-400 animate-pulse ml-1">
              ✓ {t("all_voted") || "All voted!"}
            </span>
          )}
        </div>

        {myVote && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2.5 flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white/60">
                {t("you_voted_for")}:
              </span>
              <span className="text-sm font-bold text-amber-400">
                {votedPlayerName}
              </span>
            </div>
            <button
              onClick={() => handleVote(myVote)}
              className="text-[10px] font-semibold text-red-400 underline underline-offset-2"
            >
              {t("retract_vote")}
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons - visible to everyone */}
      <div
        style={{ animationDelay: "1200ms" }}
        className="animate__animated animate__fadeInUp relative z-10 w-full max-w-lg px-5 mt-3 flex flex-col gap-2 pb-20"
      >
        {isHost && (
          <>
            <button
              onClick={handleConfirm}
              className="btn w-full border-0 text-title font-extrabold text-base h-12 rounded-xl shadow-xl transition-all active:scale-95"
              style={{
                background:
                  "linear-gradient(135deg, #8b5cf6, #a855f7, #c084fc)",
                color: "white",
                boxShadow: "0 8px 30px rgba(139, 92, 246, 0.4)",
              }}
            >
              <FaCrown className="mr-1.5" /> {t("confirm_leader")}
            </button>
            <button
              onClick={handleSkip}
              className="text-xs text-white/30 font-light underline underline-offset-4 mt-1"
            >
              {t("skip_vote")}
            </button>
          </>
        )}
        {!isHost && (
          <p className="text-xs text-white/30 font-light text-center">
            {totalVotes >= (totalPlayerCount || players.length)
              ? t("confirming_leaders") || "Confirming leaders..."
              : t("waiting_for_votes") || "Waiting for all players to vote..."}
          </p>
        )}
      </div>
    </div>
  );
}

function VoteCard({
  player,
  isMe,
  isVoted,
  isLeading,
  isCurrentLeader,
  voteCount,
  onClick,
  disabled = false,
  delay = 0,
  t,
}) {
  const avaConfig = useMemo(() => {
    return genConfig(player?.name || player?.id || "a");
  }, [player?.name, player?.id]);

  const cardStyle = useMemo(() => {
    if (isVoted) {
      return {
        background:
          "linear-gradient(145deg, rgba(139, 92, 246, 0.4), rgba(168, 85, 247, 0.3))",
        border: "2px solid rgba(167, 139, 250, 0.8)",
        boxShadow:
          "0 0 20px rgba(139, 92, 246, 0.3), inset 0 0 20px rgba(139, 92, 246, 0.1)",
      };
    }
    if (isLeading) {
      return {
        background:
          "linear-gradient(145deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))",
        border: "2px solid rgba(251, 191, 36, 0.4)",
        boxShadow: "0 0 15px rgba(251, 191, 36, 0.15)",
      };
    }
    return {
      background: "rgba(255, 255, 255, 0.05)",
      border: "2px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "none",
    };
  }, [isVoted, isLeading]);

  return (
    <div
      style={{ animationDelay: `${delay}ms`, ...cardStyle }}
      className={
        "animate__animated animate__fadeInUp rounded-2xl p-2.5 w-28 flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden backdrop-blur-sm " +
        (disabled
          ? " opacity-50 cursor-default "
          : " cursor-pointer active:scale-95 ")
      }
      onClick={disabled ? undefined : onClick}
    >
      {isLeading && (
        <div
          className="absolute inset-0 rounded-2xl animate-pulse"
          style={{
            background:
              "radial-gradient(circle at center, rgba(251, 191, 36, 0.1), transparent 70%)",
          }}
        />
      )}

      {isCurrentLeader && (
        <div className="absolute top-1 right-1 z-10">
          <FaCrown
            className="text-amber-400 text-[10px]"
            style={{ filter: "drop-shadow(0 1px 3px rgba(251, 191, 36, 0.5))" }}
          />
        </div>
      )}

      <div
        className={
          "relative rounded-full transition-all duration-300 " +
          (isVoted
            ? " ring-2 ring-purple-400 ring-offset-1 ring-offset-transparent "
            : "")
        }
      >
        <Avatar
          className="rounded-full"
          style={{ height: "3rem", width: "3rem" }}
          {...avaConfig}
        />
        {isVoted && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-[8px] animate__animated animate__bounceIn shadow-lg">
            ✓
          </div>
        )}
      </div>

      <h3
        className={
          "truncate w-full text-center text-[11px] mt-1.5 transition-colors duration-300 font-bold " +
          (isMe ? " text-purple-300 " : " text-white/70 ")
        }
      >
        {player?.name}
      </h3>

      <div
        className={
          "flex items-center justify-center gap-1 mt-0.5 text-sm font-bold transition-all duration-300 " +
          (isLeading && voteCount > 0
            ? " text-amber-400 scale-110 "
            : " text-white/30 ")
        }
      >
        {voteCount > 0 ? (
          <span className={isLeading ? "animate-pulse" : ""}>{voteCount}</span>
        ) : (
          <span className="text-[10px] text-white/15">0</span>
        )}
      </div>
    </div>
  );
}

export default VoteLeaderScreen;
