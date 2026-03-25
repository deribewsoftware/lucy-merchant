type Section = { heading: string; paragraphs: string[] };

export function LegalSections({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((s) => (
        <section key={s.heading}>
          <h2 className="font-display text-base font-bold tracking-tight text-foreground">
            {s.heading}
          </h2>
          <div className="mt-3 space-y-3">
            {s.paragraphs.map((p, i) => (
              <p key={`${s.heading}-${i}`}>{p}</p>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
