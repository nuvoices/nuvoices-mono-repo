import TwitterIcon from '../../public/icons/twitter.svg';
import BlueSkyIcon from '../../public/icons/bluesky.svg';
import InstagramIcon from '../../public/icons/instagram.svg';
import LinkedInIcon from '../../public/icons/linkedin.svg';
import EmailIcon from '../../public/icons/email.svg';

const socialLinks = [
  { href: 'https://www.instagram.com/nuvoicescollective', icon: InstagramIcon, label: 'Instagram' },
  { href: 'https://linkedin.com/company/nuvoices', icon: LinkedInIcon, label: 'LinkedIn' },
  { href: 'https://bsky.app/profile/nuvoices.bsky.social', icon: BlueSkyIcon, label: 'BlueSky' },
  { href: 'https://x.com/nuvoices', icon: TwitterIcon, label: 'X' },
  { href: 'mailto:nuvoices@protonmail.com', icon: EmailIcon, label: 'Email' },
];

interface SocialIconsProps {
  variant?: 'desktop' | 'mobile';
}

export default function SocialIcons({ variant = 'desktop' }: SocialIconsProps) {
  if (variant === 'mobile') {
    return (
      <>
        {socialLinks.map((social) => {
          const Icon = social.icon;
          return (
            <a
              key={social.label}
              href={social.href}
              aria-label={social.label}
              className="flex items-center justify-center hover:opacity-70 transition"
            >
              <Icon className="w-[14px] h-[14px] text-[#f4ecea]" />
            </a>
          );
        })}
      </>
    );
  }

  return (
    <div className="hidden sm:flex gap-[0.781rem]">
      {socialLinks.map((social) => {
        const Icon = social.icon;
        return (
          <a
            key={social.label}
            href={social.href}
            aria-label={social.label}
            className="hover:opacity-80 transition"
          >
            <Icon className="w-[1rem] h-[1rem] text-[#3c2e24]" />
          </a>
        );
      })}
    </div>
  );
}
