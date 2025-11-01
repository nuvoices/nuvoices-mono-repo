interface ActionButtonProps {
  href?: string;
  label: string;
  onClick?: () => void;
}

export default function ActionButton({ href, label, onClick }: ActionButtonProps) {
  const baseStyles = "bg-[#3c2e24] rounded-[0.313rem] flex items-center justify-center transition-all duration-200 hover:bg-[#5a4638] hover:scale-105 hover:shadow-lg border-0 w-[5.5rem] h-[2.5rem] sm:w-[7.875rem] sm:h-[3.094rem]";
  const textStyles = "font-sans font-extrabold text-[0.875rem] sm:text-[1.094rem] text-[#f5f4f1] uppercase";

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
