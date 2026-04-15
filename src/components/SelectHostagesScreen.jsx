import { useMemo } from 'react';
import { useTranslation } from '../config/i18n';
import Avatar, { genConfig } from 'react-nice-avatar-vite-prod-fork';
import { FaUserPlus, FaUserClock, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import 'animate.css';

function SelectHostagesScreen({ players = [], me, execute, isHost, leaders = {}, selectedHostages = {}, hostagesConfirmed = {}, hostagesNeeded = 1 }) {

    const { t } = useTranslation();

    const myRoom = me?.room || me?.startingRoom || 1;
    const isLeader = leaders[myRoom] === me?.id;
    const hasMyRoomConfirmed = hostagesConfirmed[myRoom] === true;

    // Players in my room excluding myself (if I am leader)
    const candidates = useMemo(() => {
        return players.filter(p => p.room === myRoom && p.id !== me?.id);
    }, [players, myRoom, me?.id]);

    const myRoomSelections = useMemo(() => {
        return selectedHostages[myRoom] || [];
    }, [selectedHostages, myRoom]);

    const selectedCount = myRoomSelections.length;
    const canConfirm = selectedCount === hostagesNeeded;

    const leaderPlayer = useMemo(() => {
        const leaderId = leaders[myRoom];
        return players.find(p => p.id === leaderId);
    }, [leaders, myRoom, players]);

    function handleToggle(playerId) {
        if (!isLeader || hasMyRoomConfirmed) return;
        
        // Don't allow selecting more than needed, unless they are deselecting
        if (selectedCount >= hostagesNeeded && !myRoomSelections.includes(playerId)) {
            return; 
        }

        execute("toggle-hostage", [myRoom, playerId]);
    }

    function handleConfirm() {
        if (!canConfirm) return;
        execute("confirm-room-hostages", [myRoom]);
    }

    // Determine status text
    const statusText = useMemo(() => {
        if (hasMyRoomConfirmed) {
            return t("waiting_other_room") || "Waiting for the other room...";
        }
        if (isLeader) {
            return `${t("select")} ${hostagesNeeded} ${hostagesNeeded === 1 ? t("hostage") || "Hostage" : t("hostages") || "Hostages"}`;
        }
        return `${t("waiting_for_leader") || "Waiting for Leader"} ${leaderPlayer?.name || ""}...`;
    }, [hasMyRoomConfirmed, isLeader, hostagesNeeded, leaderPlayer, t]);


    return (
        <div className='absolute inset-0 flex flex-col items-center justify-start text-title text-white drop-shadow-md gap-0 text-center overflow-y-scroll overflow-hidden scrollbar-hide z-[95]'
            style={{ background: 'linear-gradient(145deg, #330510 0%, #2e0a15 30%, #3a0c1a 60%, #501121 100%)' }}
        >
            {/* Floating orbs background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-64 h-64 rounded-full opacity-10 animate-pulse" style={{ background: 'radial-gradient(circle, #f43f5e, transparent)', top: '-5%', left: '-10%' }} />
                <div className="absolute w-80 h-80 rounded-full opacity-10 animate-pulse" style={{ background: 'radial-gradient(circle, #e11d48, transparent)', bottom: '-10%', right: '-15%', animationDelay: '1s' }} />
                <div className="absolute w-40 h-40 rounded-full opacity-5 animate-pulse" style={{ background: 'radial-gradient(circle, #be123c, transparent)', top: '40%', left: '60%', animationDelay: '2s' }} />
            </div>

            {/* Header */}
            <div className='relative z-10 flex flex-col items-center pt-8 pb-1 w-full'>
                <div style={{ animationDelay: '0ms' }} className='animate__animated animate__bounceInDown flex items-center justify-center gap-3 mb-1'>
                    {hasMyRoomConfirmed ? (
                        <FaCheckCircle className="text-green-400 text-3xl drop-shadow-lg" />
                    ) : (
                        <FaUserClock className="text-rose-400 text-3xl drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 10px rgba(244, 63, 94, 0.5))' }} />
                    )}
                </div>
                <h1 style={{ animationDelay: '200ms' }} className='animate__animated animate__fadeInUp text-2xl tracking-wider uppercase font-extrabold'>
                    {t("hostage_exchange") || "Hostage Exchange"}
                </h1>
                <p style={{ animationDelay: '400ms' }} className='animate__animated animate__fadeInUp text-xs font-light text-white/70 mt-0.5 max-w-xs'>
                    {statusText}
                </p>
            </div>

            {/* Selection Progress (visible to Leader only, or everyone?) */}
            <div style={{ animationDelay: '500ms' }} className='animate__animated animate__fadeInUp relative z-10 w-full max-w-lg px-4 mt-3 mb-2 flex items-center justify-center'>
                <div className={'rounded-xl py-2 px-6 flex items-center justify-center gap-2 font-bold text-sm backdrop-blur-sm shadow-lg border-2 ' + (canConfirm ? 'border-green-400 bg-green-500/20 text-white' : 'border-rose-400 bg-rose-500/20 text-white')}>
                    <span>{selectedCount} / {hostagesNeeded} {t("selected") || "Selected"}</span>
                </div>
            </div>

            {/* Player Grid */}
            <div style={{ animationDelay: '600ms' }} className='animate__animated animate__fadeInUp relative z-10 w-full max-w-lg px-4 mt-1'>
                <div className="grid grid-cols-3 gap-2.5">
                    {candidates.map((player, i) => {
                        const isSelected = myRoomSelections.includes(player.id);
                        
                        return (
                            <HostageCard
                                key={player.id}
                                player={player}
                                isSelected={isSelected}
                                onClick={() => handleToggle(player.id)}
                                delay={600 + (i * 60)}
                                disabled={!isLeader || hasMyRoomConfirmed || (!isSelected && selectedCount >= hostagesNeeded)}
                                isLeader={isLeader}
                            />
                        );
                    })}
                </div>
                
                {candidates.length === 0 && (
                    <div className='text-white/30 text-sm py-8'>{t("no_players_available") || "No other players in room."}</div>
                )}
            </div>

            {/* Action Buttons - Leader Only */}
            {isLeader && !hasMyRoomConfirmed && (
                <div style={{ animationDelay: '800ms' }} className='animate__animated animate__fadeInUp relative z-10 w-full max-w-lg px-5 mt-6 flex gap-2 pb-20 justify-center'>
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        className={'btn w-full max-w-xs border-0 text-white font-extrabold text-base h-12 rounded-xl shadow-xl transition-all ' + (canConfirm ? ' active:scale-95 cursor-pointer ' : ' opacity-50 cursor-not-allowed ')}
                        style={{
                            background: canConfirm ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.1)',
                            boxShadow: canConfirm ? '0 8px 30px rgba(16, 185, 129, 0.4)' : 'none',
                        }}
                    >
                        {canConfirm ? (t("confirm_hostages") || "Confirm Hostages") : (t("select_more") || "Select more...")}
                    </button>
                </div>
            )}
            
            {/* Non-Leader Waiting Indicator */}
            {(!isLeader || hasMyRoomConfirmed) && (
                <div style={{ animationDelay: '800ms' }} className='animate__animated animate__fadeInUp relative z-10 w-full max-w-lg px-5 mt-8 flex flex-col items-center pb-20'>
                    <FaSpinner className='animate-spin text-2xl text-rose-400 mb-3 opacity-80' />
                    <p className='text-xs text-white/50 font-light text-center'>
                        {t("please_wait") || "Please wait..."}
                    </p>
                </div>
            )}
        </div>
    );
}


function HostageCard({ player, isSelected, onClick, disabled = false, delay = 0, isLeader }) {

    const avaConfig = useMemo(() => {
        return genConfig(player?.name || player?.id || "a");
    }, [player?.name, player?.id]);

    const cardStyle = useMemo(() => {
        if (isSelected) {
            return {
                background: 'linear-gradient(145deg, rgba(244, 63, 94, 0.4), rgba(225, 29, 72, 0.3))',
                border: '2px solid rgba(251, 113, 133, 0.8)',
                boxShadow: '0 0 20px rgba(244, 63, 94, 0.3), inset 0 0 20px rgba(244, 63, 94, 0.1)',
            };
        }
        return {
            background: 'rgba(255, 255, 255, 0.03)',
            border: '2px solid rgba(255, 255, 255, 0.05)',
            boxShadow: 'none',
        };
    }, [isSelected]);


    return (
        <div
            style={{ animationDelay: `${delay}ms`, ...cardStyle }}
            className={'animate__animated animate__fadeInUp rounded-2xl p-2.5 flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden backdrop-blur-sm ' + ((disabled && !isSelected) ? ' opacity-40 ' : '') + ((!disabled && isLeader) ? ' cursor-pointer hover:bg-white/10 active:scale-95 ' : ' cursor-default ')}
            onClick={disabled ? undefined : onClick}
        >
            <div className={'relative rounded-full transition-all duration-300 ' + (isSelected ? ' ring-2 ring-rose-400 ring-offset-1 ring-offset-transparent ' : '')}>
                <Avatar className='rounded-full' style={{ height: "3rem", width: "3rem", opacity: disabled && !isSelected ? 0.7 : 1 }} {...avaConfig} />
                {isSelected && (
                    <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[8px] animate__animated animate__bounceIn shadow-lg font-bold'>
                        ✓
                    </div>
                )}
            </div>

            <h3 className={'truncate w-full text-center text-[11px] mt-2 transition-colors duration-300 font-bold ' + (isSelected ? ' text-rose-200 ' : ' text-white/50 ')}>
                {player?.name}
            </h3>
            
            {isSelected ? (
                 <div className='text-[9px] text-rose-300 font-semibold mt-0.5 animate-pulse uppercase tracking-wider'>Hostage</div>
            ) : (
                 <div className='text-[9px] text-transparent mt-0.5'>-</div>
            )}
        </div>
    );
}

export default SelectHostagesScreen;
