import instagramIcon from "/social-icons/Instagram.png";
import discordIcon from "/social-icons/Discord.png";
import mailIcon from "/social-icons/mail.png";
import linkedInIcon from "/social-icons/LinkedIn.png";
import twitterIcon from "/social-icons/Twitter.png";

const Footer = () => {
  const contactIcons = (
    <div className="flex m-0 p-0 h-[39px] items-center gap-[25px] ">
      <a
        href="mailto:contact@tesc.ucsd.edu"
        className="text-white text-[clamp(20px,2vw,26px)] leading-[39px]"
      >
        <img src={mailIcon} alt="Mail" />
      </a>

      <a
        href="https://www.instagram.com/tesc.at.ucsd"
        className=" text-white text-[clamp(20px,2vw,26px)] leading-[39px]"
      >
        <img src={instagramIcon} alt="Instagram" />
      </a>

      <a
        href="https://www.linkedin.com/company/ucsdtesc"
        className=" text-white text-[clamp(20px,2vw,26px)] leading-[39px]"
      >
        <img src={linkedInIcon} alt="LinkedIn" />
      </a>

      <a
        href="https://x.com/UCSDTESC/"
        className=" text-white text-[clamp(20px,2vw,26px)] leading-[39px]"
      >
        <img src={twitterIcon} alt="Twitter" />
      </a>

      <a
        href="https://tescucsd.org/discord"
        className=" text-white text-[clamp(20px,2vw,26px)] leading-[39px]"
      >
        <img src={discordIcon} alt="Discord" />
      </a>
    </div>
  );

  return (
    <>
      <footer className="bg-radial from-[#114675] from-40% to-navy w-full py-12 px-18 sm:px-25 md:px-34 lg:px-40 xl:px-55">
        <div className="max-w-5xl flex flex-col items-start text-left">
          <h2 className="text-offWhite text-[26px] font-bold mb-3">
            Interested? Connect with us!
          </h2>

          <p className="text-offWhite text-[16px] font-normal max-w-md leading-relaxed mb-5">
            Stay connected with us! Follow us for updates on events, opportunities, and ways to get
            involved.
          </p>

          {contactIcons}

          <p className="text-white mt-5">
            Have an issue or a suggestion to report? &nbsp;
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfVzJQ8li2d8is_hpj3btZbfrYGp1FZR00_OojU5uG5YZ4yuA/viewform?usp=dialog"
              className="text-lightBlue hover:underline"
            >
              Click here to give us feedback
            </a>
          </p>
        </div>
      </footer>
    </>
  );
};

export default Footer;
