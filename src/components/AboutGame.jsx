import { useTranslation } from "../config/i18n";
import { TbDeviceMobileHeart } from "react-icons/tb";

function AboutGame() {
  const { t, language } = useTranslation();

  const content = {
    en: {
      title: "Welcome to KABOOM",
      desc1:
        "KABOOM is a digital companion for the social deduction game 'Two Rooms and a Boom'.",
      desc2:
        "No cards? No problem. Use your phones to distribute roles, track time, and play anywhere with your friends in person.",
      cta: "New to the game? Check out the Rules!",
    },
    th: {
      title: "ยินดีต้อนรับสู่ KABOOM",
      desc1:
        "KABOOM คือเครื่องมือช่วยเล่นเกม 'Two Rooms and a Boom' ในรูปแบบดิจิทัล",
      desc2:
        "เล่นได้ง่ายๆ แม้ไม่มีไพ่จริง เพียงใช้มือถือแจกบทบาท ติดตามเวลา และเริ่มสนุกกับกลุ่มเพื่อนต่อหน้าได้ทันที",
      cta: "เพิ่งเคยเล่นใช่ไหม? ลองดูหน้า กติกาการเล่นได้เลย!",
    },
  };

  const activeContent = content[language] || content.en;

  return (
    <div className="w-full border-2 border-neutral rounded-xl p-6 flex flex-col items-center justify-start bg-base-100/50 backdrop-blur-sm shadow-inner">
      <div className="w-full flex gap-4 items-center mb-4">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
          <TbDeviceMobileHeart size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-title uppercase mb-2">
            {activeContent.title}
          </h2>
          <p className="text-xs text-secondary font-bold uppercase tracking-wider leading-relaxed">
            {activeContent.desc1}
          </p>
        </div>
      </div>

      <div className="text-normal text-sm md:text-base leading-relaxed text-neutral/80 italic">
        "{activeContent.desc2}"
      </div>

      <div className="w-full h-[1px] bg-neutral/10 my-4"></div>

      <div className="w-full text-center">
        <a
          href="/TwoRooms_Rulebook_v3.pdf"
          target="_blank"
          className="text-xs font-bold text-primary uppercase tracking-widest animate-pulse hover:underline cursor-pointer transition-all block py-2"
        >
          {activeContent.cta}
        </a>
      </div>
    </div>
  );
}

export default AboutGame;
