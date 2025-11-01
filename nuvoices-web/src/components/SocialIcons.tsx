import TwitterIcon from '../../public/icons/twitter.svg';
import InstagramIcon from '../../public/icons/instagram.svg';
import LinkedInIcon from '../../public/icons/linkedin.svg';
import EmailIcon from '../../public/icons/email.svg';

const socialLinks = [
  { href: '#', icon: TwitterIcon, label: 'Twitter' },
  { href: '#', icon: InstagramIcon, label: 'Instagram' },
  { href: '#', icon: LinkedInIcon, label: 'LinkedIn' },
  { href: '#', icon: EmailIcon, label: 'Email' },
];

interface SocialIconsProps {
  variant?: 'desktop' | 'mobile';
}

export default function SocialIcons({ variant = 'desktop' }: SocialIconsProps) {
  if (variant === 'mobile') {
    return (
      <div className="flex gap-3 mt-8 pt-6">
        {socialLinks.map((social) => {
          const Icon = social.icon;
          return (
            <a
              key={social.label}
              href={social.href}
              aria-label={social.label}
              className="w-12 h-12 flex items-center justify-center hover:bg-[#f4ecea]/10 rounded-lg transition"
            >
              <Icon className="w-[1rem] h-[1rem] text-[#f4ecea]" />
            </a>
          );
        })}
      </div>
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
