import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Droplets, ShieldCheck, Sparkles } from "lucide-react";

const INSTALIGHT_BENEFITS = [
  "Mirror-shine završnica",
  "Mekoća bez slepljivanja",
  "Savršeno za farbanu i osvetljenu kosu",
];

const INTEGRITY_BENEFITS = [
  "Dubinska ishrana i obnova",
  "Manje lomljenja i krzanja",
  "Idealno posle blanša, farbe i toplote",
];

const GLAM_BENEFITS = [
  "Postojan glow kroz celu proslavu",
  "Fotogeničan finiš pod svim svetlima",
  "Personalizovan glam prema tenu i stilu",
];

const GLAM_GALLERY = [
  { src: "/tretmani/sminka/1.avif", alt: "Profesionalna glam šminka sa sjajnim tenom" },
  { src: "/tretmani/sminka/2.avif", alt: "Profesionalna glam šminka u detalju" },
  { src: "/tretmani/sminka/3.avif", alt: "Profesionalna glam šminka iz drugog ugla" },
  { src: "/tretmani/sminka/4.avif", alt: "Precizno definisana profesionalna šminka" },
];

export function PremiumTreatmentShowcase() {
  const lightCtaClassName =
    "!border-transparent !bg-[#cb7652] !text-white shadow-[0_20px_40px_-24px_rgba(118,63,38,0.5)] hover:!bg-[#b56442]";
  const darkCtaClassName =
    "!border-[#f3ddcf]/28 !bg-[#f3ddcf] !text-[#211411] shadow-[0_20px_40px_-24px_rgba(0,0,0,0.5)] hover:!bg-[#ffe8db]";

  return (
    <div className="space-y-5">
      <section
        className="home-panel home-reveal overflow-hidden rounded-[2rem] border border-[#ead8cb] bg-[linear-gradient(135deg,#fff8f2_0%,#f5ede4_48%,#efe0d1_100%)] px-5 py-6 shadow-[0_30px_90px_-48px_rgba(73,46,29,0.42)] dark:border-[#4f372c] dark:bg-[linear-gradient(135deg,#241714_0%,#1a110f_45%,#130c0a_100%)] dark:shadow-[0_36px_110px_-52px_rgba(0,0,0,0.86)] sm:px-8 sm:py-8 lg:px-10 lg:py-10"
        aria-labelledby="instalight-heading"
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
          <div className="max-w-[36rem] space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#8b5e49] shadow-[0_18px_40px_-28px_rgba(94,57,35,0.5)] backdrop-blur dark:border-white/10 dark:bg-white/8 dark:text-[#f0d3bf] dark:shadow-none">
              <Droplets className="size-4" />
              Instalight tretman
            </div>

            <div className="space-y-4">
              <h2
                id="instalight-heading"
                className="max-w-[13ch] font-[var(--serif-font)] text-3xl leading-none text-[#2f211c] dark:text-[#fff1e8] sm:text-[2.55rem] lg:text-[3.35rem]"
              >
                Staklast sjaj i svila pod prstima.
              </h2>
              <p className="max-w-[34rem] text-base leading-7 text-[#5f4d45] dark:text-[#e4d1c5] sm:text-[1.05rem]">
                Kada kosa izgubi refleksiju, Instalight vraća onaj luksuzan, staklast sjaj koji se vidi pri svakom
                pokretu.
              </p>
            </div>

            <div className="space-y-4 text-[0.98rem] leading-7 text-[#594841] dark:text-[#efe3dc]">
              <p>
                Ovaj tretman za osvetljenu, farbanu i umornu kosu zaglađuje površinu vlasi, smanjuje poroznost i
                ostavlja kosu svilenom, mekom i blistavom bez osećaja težine.
              </p>
              <p>
                Idealan je kada želiš da kosa odmah izgleda negovano, luksuzno i uredno, ali i da zadrži elastičnost,
                disciplinu i sjaj još danima nakon dolaska iz salona.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {INSTALIGHT_BENEFITS.map((benefit) => (
                <span
                  key={benefit}
                  className="rounded-full border border-[#e7d3c4] bg-white/80 px-4 py-2 text-sm font-medium text-[#6b5449] dark:border-white/10 dark:bg-white/8 dark:text-[#f6e7dd]"
                >
                  {benefit}
                </span>
              ))}
            </div>

            <ThemeCtaLink
              href="/kontakt"
              label="Rezerviši Instalight tretman"
              lightClassName={lightCtaClassName}
              darkClassName={darkCtaClassName}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[0.88fr_1.08fr_0.88fr] md:items-center">
            <AutoplayVideoCard
              src="/tretmani/instalight/video-1.webm"
              className="min-h-[17rem] md:min-h-[24rem]"
            />
            <MediaImageCard
              src="/tretmani/instalight/slika.avif"
              alt="Instalight tretman za sjajnu i negovanu kosu"
              className="min-h-[20rem] md:min-h-[28rem]"
              quality={100}
            />
            <AutoplayVideoCard
              src="/tretmani/instalight/video-2.webm"
              className="min-h-[17rem] md:min-h-[24rem]"
            />
          </div>
        </div>
      </section>

      <section
        className="home-panel home-reveal overflow-hidden rounded-[2rem] border border-[#e5d2c4] bg-[radial-gradient(circle_at_top_left,#fff7f0_0%,#f2e6dc_48%,#e8d8cb_100%)] px-5 py-6 text-[#3a251d] shadow-[0_34px_110px_-52px_rgba(115,73,49,0.28)] dark:border-[#3f2a22] dark:bg-[radial-gradient(circle_at_top_left,#5f4031_0%,#251916_48%,#160f0c_100%)] dark:text-[#f7ede5] dark:shadow-[0_34px_110px_-52px_rgba(10,4,2,0.95)] sm:px-8 sm:py-8 lg:px-10 lg:py-10"
        aria-labelledby="integrity-heading"
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] lg:items-center">
          <div className="relative z-10 max-w-[35rem] space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ecd7cb] bg-white/82 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#8d5c47] backdrop-blur dark:border-white/10 dark:bg-white/8 dark:text-[#f1d6c0]">
              <ShieldCheck className="size-4" />
              Integrity tretman
            </div>

            <div className="space-y-4">
              <h2
                id="integrity-heading"
                className="max-w-[12ch] font-[var(--serif-font)] text-3xl leading-none text-[#241610] dark:text-white sm:text-[2.55rem] lg:text-[3.35rem]"
              >
                Obnova za kosu koja traži ozbiljan oporavak.
              </h2>
              <p className="max-w-[32rem] text-base leading-7 text-[#604c43] dark:text-[#dbc4b7] sm:text-[1.05rem]">
                Kada su dužine iscrpljene blajhanjem, toplotom i čestim hemijskim procesima, Integrity vraća ono
                najvažnije: punoću, mekoću i otpornost.
              </p>
            </div>

            <div className="space-y-4 text-[0.98rem] leading-7 text-[#4f3e37] dark:text-[#eeded3]">
              <p>
                Dubinski hranljivi ritual intenzivno neguje suve i beživotne vlasi, popunjava osećaj krhkosti i
                pomaže da kosa ponovo izgleda zdravo, gipko i disciplinovano na dodir.
              </p>
              <p>
                Rezultat je kosa koja se lakše raščešljava, manje puca i dobija onaj pun, negovan izgled koji se vidi
                od korena do krajeva.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {INTEGRITY_BENEFITS.map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-[1.4rem] grid place-items-center border border-[#e6d4c7] bg-white/84 px-4 py-3 text-sm font-medium text-[#3e2a21] backdrop-blur dark:border-white/10 dark:bg-white/8 dark:text-[#f7ede5]"
                >
                  {benefit}
                </div>
              ))}
            </div>

            <div className="rounded-[1.75rem] border border-[#e6d3c8] bg-white/74 p-5 backdrop-blur dark:border-white/10 dark:bg-white/7">
              <p className="text-sm uppercase tracking-[0.28em] text-[#9f6b53] dark:text-[#d9b9a2]">
                Za kosu koja je pretrpela previše
              </p>
              <p className="mt-3 max-w-[28rem] text-[0.98rem] leading-7 text-[#4e3b34] dark:text-[#f1e3da]">
                Savršen izbor kada želiš da umiriš lomljenje, vratiš mekoću i pripremiš kosu za sledeću boju,
                stilizovanje ili jednostavno zdraviji svakodnevni izgled.
              </p>
            </div>

            <ThemeCtaLink
              href="/kontakt"
              label="Zatraži plan oporavka"
              lightClassName={lightCtaClassName}
              darkClassName={darkCtaClassName}
            />
          </div>

          <div className="relative min-h-[24rem] sm:min-h-[31rem]">
            <div
              className="absolute inset-x-[10%] top-6 h-24 rounded-full bg-[#b47a59]/30 blur-3xl dark:bg-[#b47a59]/25"
              aria-hidden="true"
            />

            <div className="absolute right-0 top-0 w-[78%] overflow-hidden rounded-[2rem] border border-[#ead8cc] shadow-[0_30px_80px_-42px_rgba(92,56,35,0.3)] dark:border-white/12 dark:shadow-[0_30px_80px_-42px_rgba(0,0,0,0.82)]">
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                disablePictureInPicture
                aria-label="Integrity tretman za obnovu oštećene kose"
                className="h-full w-full object-cover"
              >
                <source src="/tretmani/integrity/snimak-1.webm" type="video/webm" />
              </video>
            </div>

            <div className="absolute bottom-0 left-0 w-[58%] overflow-hidden rounded-[1.8rem] border border-[#ead8cc] bg-[#f3ebe4] shadow-[0_28px_70px_-44px_rgba(92,56,35,0.32)] dark:border-white/12 dark:bg-[#241814] dark:shadow-[0_28px_70px_-44px_rgba(0,0,0,0.9)]">
              <Image
                src="/tretmani/integrity/slika-2.avif"
                alt="Dubinska nega i restrukturiranje kose Integrity tretmanom"
                width={900}
                height={1100}
                quality={100}
                sizes="(max-width: 1024px) 56vw, 25vw"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="absolute bottom-8 right-[12%] rounded-[1.5rem] border border-[#ead5ca] bg-[#fff7f1] px-4 py-3 text-[#3a251d] shadow-[0_18px_50px_-30px_rgba(92,56,35,0.28)] dark:border-white/10 dark:bg-[#f7ede5] dark:shadow-[0_18px_50px_-30px_rgba(0,0,0,0.8)]">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#8b5e49]">Repair finish</p>
              <p className="mt-1 text-sm font-medium">Mekša tekstura. Jača vlas. Mirniji krajevi.</p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="home-panel home-reveal overflow-hidden rounded-[2rem] border border-[#ead6ca] bg-[linear-gradient(180deg,#fbf3ec_0%,#f5ebe4_42%,#f0e0d4_100%)] px-5 py-6 shadow-[0_30px_90px_-48px_rgba(88,40,26,0.35)] dark:border-[#4b342c] dark:bg-[linear-gradient(180deg,#241715_0%,#1a1110_45%,#140d0c_100%)] dark:shadow-[0_36px_110px_-50px_rgba(0,0,0,0.85)] sm:px-8 sm:py-8 lg:px-10 lg:py-10"
        aria-labelledby="glam-heading"
      >
        <div className="flex flex-col gap-8">
          <div className="max-w-[42rem] space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#9a5f4c] shadow-[0_18px_40px_-28px_rgba(94,57,35,0.45)] backdrop-blur dark:border-white/10 dark:bg-white/8 dark:text-[#f0d3c6] dark:shadow-none">
              <Sparkles className="size-4" />
              Profesionalna glam style šminka
            </div>

            <h2
              id="glam-heading"
              className="max-w-[16ch] font-[var(--serif-font)] text-3xl leading-none text-[#2a1d18] dark:text-[#fff1ea] sm:text-[2.55rem] lg:text-[3.3rem]"
            >
              Samopouzdanje koje se vidi pre nego što kažeš ijednu reč.
            </h2>

            <p className="max-w-[36rem] text-base leading-7 text-[#5d4c44] dark:text-[#e7d5cc] sm:text-[1.05rem]">
              Za dane kada želiš da tvoj pogled, ten i celokupan izraz deluju glamurozno, elegantno i potpuno
              sigurno pred svakim objektivom.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-start">
            <div className="space-y-4 text-[0.98rem] leading-7 text-[#5f4d45] dark:text-[#efe0d8]">
              <p>
                Profesionalna glam šminka naglašava crte lica, otvara pogled i daje koži luksuzan, fotografiji spreman
                finiš koji ostaje besprekoran tokom celog događaja.
              </p>
              <p>
                Bilo da je u pitanju svadba, rođendan, gala događaj ili važno fotografisanje, svaki detalj se
                prilagođava tvom tenu, haljini, svetlu prostora i energiji prilike.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                {GLAM_BENEFITS.map((benefit) => (
                  <span
                    key={benefit}
                    className="rounded-full border border-[#e3cfc2] bg-white/82 px-4 py-2 text-sm font-medium text-[#6b5349] dark:border-white/10 dark:bg-white/8 dark:text-[#f5e5dc]"
                  >
                    {benefit}
                  </span>
                ))}
              </div>

              <ThemeCtaLink
                href="/kontakt"
                label="Rezerviši glam termin"
                lightClassName={lightCtaClassName}
                darkClassName={darkCtaClassName}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1.14fr)_minmax(0,0.86fr)]">
                <div className="relative overflow-hidden rounded-[2rem] border border-[#ebd7cb] bg-[#f7efe8] shadow-[0_26px_70px_-42px_rgba(60,31,18,0.35)] dark:border-[#4f372e] dark:bg-[#211513] dark:shadow-[0_26px_70px_-42px_rgba(0,0,0,0.78)]">
                  <Image
                    src={GLAM_GALLERY[0].src}
                    alt={GLAM_GALLERY[0].alt}
                    width={1200}
                    height={1500}
                    quality={100}
                    sizes="(max-width: 1024px) 100vw, 28vw"
                    className="h-full min-h-[24rem] w-full object-cover"
                  />
                </div>

                <div className="grid gap-4">
                  <div className="overflow-hidden rounded-[1.7rem] border border-[#ead8cc] bg-white/70 shadow-[0_24px_65px_-42px_rgba(63,34,21,0.35)] dark:border-[#4a342c] dark:bg-[#201412] dark:shadow-[0_24px_65px_-42px_rgba(0,0,0,0.78)] sm:translate-y-5">
                    <Image
                      src={GLAM_GALLERY[1].src}
                      alt={GLAM_GALLERY[1].alt}
                      width={900}
                      height={1100}
                      quality={100}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 48vw, 16vw"
                      className="h-full min-h-[12rem] w-full object-cover"
                    />
                  </div>

                  <div className="overflow-hidden rounded-[1.7rem] border border-[#ead8cc] bg-white/70 shadow-[0_24px_65px_-42px_rgba(63,34,21,0.35)] dark:border-[#4a342c] dark:bg-[#201412] dark:shadow-[0_24px_65px_-42px_rgba(0,0,0,0.78)] sm:-translate-y-5">
                    <Image
                      src={GLAM_GALLERY[2].src}
                      alt={GLAM_GALLERY[2].alt}
                      width={900}
                      height={1100}
                      quality={100}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 48vw, 16vw"
                      className="h-full min-h-[12rem] w-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[2rem] border border-[#ebd7cb] bg-[#f7efe8] shadow-[0_26px_70px_-42px_rgba(60,31,18,0.35)] dark:border-[#4f372e] dark:bg-[#211513] dark:shadow-[0_26px_70px_-42px_rgba(0,0,0,0.78)]">
                <Image
                  src={GLAM_GALLERY[3].src}
                  alt={GLAM_GALLERY[3].alt}
                  width={1200}
                  height={1500}
                  quality={100}
                  sizes="(max-width: 1024px) 100vw, 26vw"
                  className="h-full min-h-[24rem] w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 flex min-h-[25%] flex-col justify-end bg-[linear-gradient(180deg,rgba(31,20,17,0)_0%,rgba(31,20,17,0.82)_100%)] px-5 py-4 text-white dark:bg-[linear-gradient(180deg,rgba(18,12,10,0)_0%,rgba(18,12,10,0.88)_100%)]">
                  <div className="max-w-[22rem] rounded-[1.35rem] border border-white/18 bg-white/12 px-4 py-3 shadow-[0_20px_45px_-28px_rgba(0,0,0,0.55)] backdrop-blur-md dark:border-white/12 dark:bg-white/8">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#f0cab5]">Glam Style</p>
                  <p className="mt-1 text-sm leading-6">
                    Mekan glow, definisan pogled i luksuzan finiš koji izgleda moćno uživo i na fotografijama.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function AutoplayVideoCard({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[1.8rem] border border-white/45 bg-[#f3e7da] shadow-[0_26px_70px_-40px_rgba(70,39,24,0.35)] dark:border-[#4a3329] dark:bg-[#1a1210] dark:shadow-[0_28px_72px_-42px_rgba(0,0,0,0.78)] ${className ?? ""}`}
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        className="absolute inset-0 block h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
      >
        <source src={src} type="video/webm" />
      </video>
    </div>
  );
}

function MediaImageCard({
  src,
  alt,
  className,
  quality = 100,
}: {
  src: string;
  alt: string;
  className?: string;
  quality?: 75 | 90 | 100;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[2rem] border border-white/45 bg-[#f3e7da] shadow-[0_28px_80px_-44px_rgba(66,37,24,0.4)] dark:border-[#4a342b] dark:bg-[#181110] dark:shadow-[0_30px_82px_-44px_rgba(0,0,0,0.8)] ${className ?? ""}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        quality={quality}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 44vw, 20vw"
        className="object-cover transition duration-700 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1f1510]/55 via-transparent to-transparent" aria-hidden="true" />
    </div>
  );
}

function ThemeCtaLink({
  href,
  label,
  lightClassName,
  darkClassName,
}: {
  href: string;
  label: string;
  lightClassName: string;
  darkClassName: string;
}) {
  const sharedClassName =
    "w-fit items-center gap-2 rounded-full !border px-5 py-3 text-sm font-semibold transition";

  return (
    <>
      <Link href={href} className={`inline-flex dark:hidden ${sharedClassName} ${lightClassName}`}>
        {label}
        <ArrowRight className="size-4" />
      </Link>
      <Link href={href} className={`hidden dark:inline-flex ${sharedClassName} ${darkClassName}`}>
        {label}
        <ArrowRight className="size-4" />
      </Link>
    </>
  );
}
