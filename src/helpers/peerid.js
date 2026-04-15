const peerjsid = import.meta.env.VITE_PEERJS_ID;

export function constructPeerID(gameID, playerID) {
  return `${gameID}-${playerID}-${peerjsid}`;
}

export function sendConstructor(myid, data, options = {}) {
  return { myid, data, options };
}

export async function getPeerConfig() {
  try {
    const ice_result = await fetch("https://personal-api-xecora.fly.dev/get-turn-config", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

    if (!ice_result.ok) throw new Error("Failed to fetch TURN config");

    const ice = await ice_result.json();

    return {
      secure: true,
      host: "peerjs-server-1759387413.fly.dev",
      port: 443,
      key: "peerjs",
      allow_discovery: true,
      config: {
        iceServers: ice,
      },
    };
  } catch (error) {
    console.warn("Using fallback STUN servers due to PeerJS config error:", error);
    // Fallback to default public Google STUN servers if the custom API is down
    return {
      secure: true,
      host: "peerjs-server-1759387413.fly.dev",
      port: 443,
      key: "peerjs",
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    };
  }
}
