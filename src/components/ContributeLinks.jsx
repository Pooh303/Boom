function ContributeLinks(props) {
  return (
    <div className="w-full flex flex-col items-center max-w-md gap-2 px-10 my-4">
      <h1 className="text-title font-extrabold text-2xl py-4">Contribute</h1>
      <Link
        className="bg-[#1b1f23] border-4 border-[#1b1f23] text-white font-bold text-2xl "
        src="/github.png"
        href="https://github.com/Pooh303"
      >
        GitHub
      </Link>
      <Link
        className="bg-[#5562ea] border-4 border-[#5562ea] p-0.5 pl-2.5"
        src="/discordbanner.png"
        href="https://discord.gg/4XgRh5N5Uc"
      ></Link>
    </div>
  );
}

function Link({ src = "", href = "/", children, className = "" }) {
  return (
    <a
      href={href}
      target="_blank"
      className={
        " shadow-lg hover:shadow-xl transition-all hover:scale-105 clickable rounded-full h-14 p-1.5 w-full flex justify-start items-center gap-3 " +
        className
      }
    >
      <img className="h-full" src={src} alt="" />
      {children}
    </a>
  );
}

export default ContributeLinks;
