interface ActionButtonProps {
  href?: string;
  label: string;
  onClick?: () => void;
  variant?: 'fixed' | 'flexible';
}

export default function ActionButton({ href, label, onClick, variant = 'fixed' }: ActionButtonProps) {
  const fixedStyles = "bg-[#3c2e24] rounded-[0.313rem] flex items-center justify-center transition-all duration-200 hover:bg-[#5a4638] hover:scale-105 hover:shadow-lg border-0 w-[5.5rem] h-[2.5rem] sm:w-[7.875rem] sm:h-[3.094rem]";
  const flexibleStyles = "bg-[#3c2e24] rounded-[0.313rem] inline-block px-[2.5rem] py-[0.75rem] transition hover:bg-opacity-90 border-0";

  const baseStyles = variant === 'flexible' ? flexibleStyles : fixedStyles;
  const textStyles = variant === 'flexible'
    ? "font-sans font-extrabold text-[0.781rem] text-[#f5f4f1] uppercase"
    : "font-sans font-extrabold text-[0.875rem] sm:text-[1.094rem] text-[#f5f4f1] uppercase";

  if (href) {
    return (
      <a href={href} className={`${baseStyles} no-underline hover:no-underline`}>
        <span className={textStyles}>{label}</span>
      </a>
    );
  }

  return (
    <button onClick={onClick} className={baseStyles}>
      <span className={textStyles}>{label}</span>
    </button>
  );
}
