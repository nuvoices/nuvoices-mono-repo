interface TaxInformationProps {
  className?: string;
  children?: React.ReactNode;
}

export function TaxInformation({ className = '', children }: TaxInformationProps) {
  return (
    <div className={`mt-[2rem] ${className}`}>
      <p className="font-serif text-[0.9375rem] leading-[1.6] text-black">
        NUVOICES INC is a non-profit charity (
        <a
          href="https://apps.irs.gov/app/eos/"
          className="text-black underline hover:opacity-70 transition"
          target="_blank"
          rel="noopener noreferrer"
        >
          EIN number 882135796
        </a>
        ) established in the United States under the US IRS Code Section{' '}
        <a
          href="https://en.wikipedia.org/wiki/501(c)_organization#501(c)(3)"
          className="text-black underline hover:opacity-70 transition"
          target="_blank"
          rel="noopener noreferrer"
        >
          501(c)(3)
        </a>
        , and, for that reason, donations from persons or entities located in the United States may benefit from tax-deductible status.
      </p>
      {children}
    </div>
  );
}
