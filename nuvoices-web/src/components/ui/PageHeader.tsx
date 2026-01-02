interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, className = '' }: PageHeaderProps) {
  return (
    <div className={`mb-[1.25rem] ${className}`}>
      <h1 className="text-[2.5rem] font-serif leading-[1.2] tracking-[-0.075rem] text-black">
        {title}
      </h1>
      {subtitle && (
        <p className="text-[1.5625rem] font-serif italic leading-[1.1] tracking-[-0.047rem] text-black mt-[0.5rem]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
