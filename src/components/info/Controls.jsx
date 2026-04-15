import { useTranslation } from "../../config/i18n";

function Controls() {
    const { t } = useTranslation();
    return (
        <>
            <span className="text-secondary font-extrabold">{t("card_reveal_title")}</span><br />
            {t("card_reveal_desc")}
            <br /><span className="text-secondary font-extrabold">{t("color_reveal_title")}</span><br />
            {t("color_reveal_desc")}<br />
            {t("color_reveal_disabled")}
            <br /><span className="text-secondary font-extrabold">{t("see_all_cards_title")}</span><br />
            {t("see_all_cards_desc")}
            <br /><span className="text-secondary font-extrabold">{t("swap_cards_title")}</span><br />
            {t("swap_cards_desc")}
            <br /><span className="text-secondary font-extrabold">{t("timer_menu_title")}</span><br />
            {t("timer_menu_desc")}<br />
            <span className="text-primary">{t("host_options")}</span>
            <ul className="list-disc pl-8">
                <li><b>{t("pause_resume")}</b></li>
                <li>{t("end_round_early")}</li>
                <li>{t("end_game_early")}</li>
            </ul>
            <br /><br /><span className="text-primary font-extrabold">{t("remote_party_mode")}</span><br />
            <b className="text-error">{t("do_not_use_in_person")}</b><br />
            {t("remote_mode_desc")}

        </>
    );
}

export default Controls;
