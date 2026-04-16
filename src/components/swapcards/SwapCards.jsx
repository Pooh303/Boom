import { useTranslation } from "../../config/i18n";
import { VscArrowSwap } from "react-icons/vsc";
import Avatar from "react-nice-avatar-vite-prod-fork";

export function SwapPropmt({
  initPlayer,
  withPlayer,
  onCancel = () => {},
  onAccept,
}) {
  // onAccept === true => requestee
  const { t } = useTranslation();

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="text-title font-extrabold text-xl flex flex-col items-center w-full text-center">
        {onAccept ? (
          <>
            <h1>
              <span className="text-secondary">
                {initPlayer?.name || "someone"}
              </span>{" "}
              {t("wants_to_swap")}
            </h1>
            <h3 className="text-normal font-normal text-base">
              {t("swap_instruction")}
            </h3>
          </>
        ) : (
          <h1>
            {t("waiting_for")}{" "}
            <span className="text-primary">{withPlayer?.name || "player"}</span>
            ...
          </h1>
        )}
      </div>
      <div className="flex items-center justify-around w-full p-4 py-6">
        <Ava config={initPlayer?.avaConfig} />
        <div className="text-3xl animate-size-pulse">
          <VscArrowSwap />
        </div>
        <Ava loading={!onAccept} config={withPlayer?.avaConfig} />
      </div>
      {onAccept && (
        <button
          onClick={onAccept}
          className="btn btn-primary text-title font-extrabold text-lg"
        >
          {t("swap_button")}
        </button>
      )}
      <button
        onClick={onCancel}
        className="btn-neutral btn text-title font-bold text-base"
      >
        {onAccept ? t("deny") : t("cancel_request")}
      </button>
    </div>
  );
}

function Ava({ config, loading }) {
  return (
    <div className={"h-16 w-16 relative"}>
      <Avatar {...config} className="w-full h-full" />
      {loading && (
        <div
          style={{ borderRadius: "9999px" }}
          className="absolute inset-0 btn btn-ghost btn-circle  w-full h-full noskew bg-black/30 text-white font-extrabold "
        >
          <span className="loading loading-spinner" />
        </div>
      )}
    </div>
  );
}
