interface SectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({ title, children, className = '' }: SectionProps) {
  return (
    <div className={className}>
      <h2 className="font-bold mb-[0.25rem] font-serif text-[0.9375rem]">
        {title}
      </h2>
      <div className="text-[0.9375rem] font-serif leading-[1.6] text-black">
        {children}
      </div>
    </div>
  );
}
