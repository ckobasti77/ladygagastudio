import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera, Clock3, Droplets, Eye, Feather, Palette, ShieldCheck, Sparkles } from "lucide-react";

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

const KOLORACIJA_BENEFITS = [
  "Neutralisanje toplih i ispranih tonova",
  "Ujednačena boja od korena do krajeva",
  "Svežiji sjaj bez grubog prelaza",
];

const KOLORACIJA_COMPARISON = {
  before: {
    src: "/tretmani/koloracija/pre.avif",
    alt: "Kosa pre koloracije sa ispranim i neujednačenim tonom",
    label: "Pre",
    detail: "Ispran ton, manje sjaja i neujednačene dužine.",
  },
  after: {
    src: "/tretmani/koloracija/posle.avif",
    alt: "Kosa posle koloracije sa ujednačenijom bojom i jačim sjajem",
    label: "Posle",
    detail: "Čistija nijansa, više refleksije i uredniji finiš.",
  },
} as const;

const GLAM_BENEFITS = [
  "Personalizovan glam prema tenu i stilu",
];

const GLAM_FEATURES = [
  {
    Icon: Camera,
    text: "Za dane kada želiš glamurozan i siguran izgled pred svakim objektivom.",
  },
  {
    Icon: Eye,
    text: "Profesionalna glam šminka naglašava crte lica i otvara pogled.",
  },
  {
    Icon: Feather,
    text: "Koži daje luksuzan, fotografiji spreman finiš.",
  },
  {
    Icon: Clock3,
    text: "Finiš koji ostaje besprekoran tokom celog događaja.",
  },
  {
    Icon: Sparkles,
    text: "Svaki detalj se prilagođava tvom tenu, haljini, svetlu prostora i energiji prilike.",
  },
] as const;

const GLAM_GALLERY = [
  { src: "/tretmani/sminka/1.avif", alt: "Profesionalna glam šminka sa sjajnim tenom" },
  { src: "/tretmani/sminka/2.avif", alt: "Profesionalna glam šminka u detalju" },
  { src: "/tretmani/sminka/3.avif", alt: "Profesionalna glam šminka iz drugog ugla" },
  { src: "/tretmani/sminka/4.avif", alt: "Precizno definisana profesionalna šminka" },
  { src: "/tretmani/sminka/5.avif", alt: "Profesionalna glam šminka sa naglašenim pogledom" },
  { src: "/tretmani/sminka/6.avif", alt: "Detalj oka sa profesionalnom glam šminkom" },
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
        className="home-panel home-reveal overflow-hidden rounded-[2rem] border border-[#ead5c8] bg-[linear-gradient(140deg,#fff6ee_0%,#f4e7db_46%,#ead9cb_100%)] px-5 py-6 text-[#38241b] shadow-[0_30px_92px_-48px_rgba(92,53,34,0.3)] dark:border-[#4a342b] dark:bg-[linear-gradient(140deg,#2a1c18_0%,#1c1311_46%,#130d0b_100%)] dark:text-[#f7ece5] dark:shadow-[0_34px_110px_-52px_rgba(0,0,0,0.9)] sm:px-8 sm:py-8 lg:px-10 lg:py-10"
        aria-labelledby="koloracija-heading"
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <div className="max-w-[36rem] space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#94604b] shadow-[0_18px_40px_-28px_rgba(94,57,35,0.4)] backdrop-blur dark:border-white/10 dark:bg-white/8 dark:text-[#f1d5c6] dark:shadow-none">
              <Palette className="size-4" />
              Koloracija i korekcija tona
            </div>

            <div className="space-y-4">
              <h2
                id="koloracija-heading"
                className="max-w-[13ch] font-[var(--serif-font)] text-3xl leading-none text-[#281912] dark:text-[#fff2ea] sm:text-[2.55rem] lg:text-[3.25rem]"
              >
                Čist ton, ujednačena dužina i sjaj koji se vidi.
              </h2>
              <p className="max-w-[33rem] text-base leading-7 text-[#5e4a41] dark:text-[#e4d2c8] sm:text-[1.05rem]">
                Kada se boja ispere, povuče na toplo ili izgubi dubinu, radimo korekciju tona i osvežavanje dužina da
                kosa ponovo izgleda ravnomerno, uredno i luksuzno na svetlu.
              </p>
            </div>

            <div className="space-y-4 text-[0.98rem] leading-7 text-[#534038] dark:text-[#f0e1d8]">
              <p>
                Ovaj tretman je idealan kada želiš da sačuvaš lepotu koloracije između većih farbanja, da ublažiš
                neželjene tonove i vratiš onaj čist, salonski finiš bez prenapadnog opterećenja kose.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {KOLORACIJA_BENEFITS.map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-[1.35rem] border border-[#e7d5c8] bg-white/82 px-4 py-3 text-sm font-medium text-[#473027] backdrop-blur dark:border-white/10 dark:bg-white/8 dark:text-[#f7ede7]"
                >
                  {benefit}
                </div>
              ))}
            </div>

            <div className="rounded-[1.75rem] border border-[#e4d1c4] bg-white/72 p-5 backdrop-blur dark:border-white/10 dark:bg-white/7">
              <p className="text-sm uppercase tracking-[0.28em] text-[#9a6650] dark:text-[#dcb8a5]">
                Kada se radi ova usluga
              </p>
              <p className="mt-3 max-w-[29rem] text-[0.98rem] leading-7 text-[#4d3a32] dark:text-[#f3e5dd]">
                  Najčešće posle ispiranja boje, pojave žutih ili narandžastih tonova, kao i kada želiš da dužine opet
                izgledaju kompaktno, čisto i negovano bez velikog resetovanja cele boje.
              </p>
            </div>

            <ThemeCtaLink
              href="/kontakt"
              label="Zakaži koloraciju"
              lightClassName={lightCtaClassName}
              darkClassName={darkCtaClassName}
            />
          </div>

          <div className="relative">
            <div
              className="absolute left-[14%] top-2 h-24 w-40 rounded-full bg-[#c68a67]/28 blur-3xl dark:bg-[#bf7f59]/22"
              aria-hidden="true"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {Object.values(KOLORACIJA_COMPARISON).map((item, index) => (
                <article
                  key={item.src}
                  className={`group relative ${index === 1 ? "sm:translate-y-8" : ""}`}
                >
                  <div className="overflow-hidden rounded-[2rem] border border-[#ebd8cc] bg-[#f8f0e8] shadow-[0_28px_78px_-44px_rgba(60,31,18,0.34)] dark:border-[#4c352c] dark:bg-[#1f1512] dark:shadow-[0_28px_78px_-44px_rgba(0,0,0,0.82)]">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      width={1200}
                      height={1500}
                      quality={100}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 48vw, 24vw"
                      className="h-full min-h-[22rem] w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                  </div>

                  <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between rounded-full border border-white/55 bg-white/72 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#6b4637] shadow-[0_18px_40px_-30px_rgba(62,33,21,0.32)] backdrop-blur dark:border-white/12 dark:bg-[#1f1512]/72 dark:text-[#f6e7de]">
                    <span>{item.label}</span>
                    <span>{index === 0 ? "01" : "02"}</span>
                  </div>

                  <p className="mt-3 px-1 text-sm leading-6 text-[#5b4a42] dark:text-[#e5d4cc]">
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="home-panel home-reveal overflow-hidden rounded-[2rem] border border-[#ead6ca] bg-[linear-gradient(180deg,#fbf3ec_0%,#f5ebe4_42%,#f0e0d4_100%)] px-5 py-6 shadow-[0_30px_90px_-48px_rgba(88,40,26,0.35)] dark:border-[#4b342c] dark:bg-[linear-gradient(180deg,#241715_0%,#1a1110_45%,#140d0c_100%)] dark:shadow-[0_36px_110px_-50px_rgba(0,0,0,0.85)] sm:px-8 sm:py-8 lg:px-10 lg:py-10"
        aria-labelledby="glam-heading"
      >
        <div className="mx-auto max-w-[72rem] space-y-6 sm:space-y-8">
          <div className="flex justify-center">
            <div className="inline-flex max-w-[22rem] items-center justify-center gap-2 rounded-full border border-white/70 bg-white/72 px-5 py-2 text-center text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#9a5f4c] shadow-[0_18px_40px_-28px_rgba(94,57,35,0.45)] backdrop-blur dark:border-white/10 dark:bg-white/8 dark:text-[#f0d3c6] dark:shadow-none">
              <Sparkles className="size-4 shrink-0" />
              Profesionalna glam style šminka
            </div>
          </div>

          <div className="mx-auto max-w-[48rem] text-center">
            <h2
              id="glam-heading"
              className="font-[var(--serif-font)] text-3xl leading-none text-[#2a1d18] dark:text-[#fff1ea] sm:text-[2.7rem] lg:text-[3.5rem]"
            >
              Samopouzdanje koje se vidi pre nego što kažeš ijednu reč.
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.33fr)_minmax(0,0.67fr)] lg:items-start">
            <div className="space-y-4 pt-1 text-[#5a463d] dark:text-[#efe0d8]">
              {GLAM_FEATURES.map(({ Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <Icon className="mt-1 size-5 shrink-0 text-[#bc7650] dark:text-[#f0cdb8]" />
                  <p className="text-[0.98rem] leading-8">{text}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-[9.5rem] sm:h-[10.75rem] lg:h-[11.5rem] overflow-hidden rounded-[1.75rem] border border-[#ead8cc] bg-white/75 shadow-[0_24px_60px_-42px_rgba(63,34,21,0.32)] dark:border-[#4a342c] dark:bg-[#201412] dark:shadow-[0_24px_60px_-42px_rgba(0,0,0,0.74)]">
                <Image
                  src={GLAM_GALLERY[0].src}
                  alt={GLAM_GALLERY[0].alt}
                  width={1200}
                  height={1500}
                  quality={100}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 48vw, 28vw"
                  className="h-full w-full object-cover object-[50%_48%]"
                />
              </div>

              <div className="h-[9.5rem] sm:h-[10.75rem] lg:h-[11.5rem] overflow-hidden rounded-[1.75rem] border border-[#ead8cc] bg-white/75 shadow-[0_24px_60px_-42px_rgba(63,34,21,0.32)] dark:border-[#4a342c] dark:bg-[#201412] dark:shadow-[0_24px_60px_-42px_rgba(0,0,0,0.74)]">
                <Image
                  src={GLAM_GALLERY[1].src}
                  alt={GLAM_GALLERY[1].alt}
                  width={1200}
                  height={1500}
                  quality={100}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 48vw, 28vw"
                  className="h-full w-full object-cover object-[50%_18%]"
                />
              </div>

              <div className="h-[9.5rem] sm:h-[10.75rem] lg:h-[11.5rem] overflow-hidden rounded-[1.75rem] border border-[#ead8cc] bg-white/75 shadow-[0_24px_60px_-42px_rgba(63,34,21,0.32)] dark:border-[#4a342c] dark:bg-[#201412] dark:shadow-[0_24px_60px_-42px_rgba(0,0,0,0.74)]">
                <Image
                  src={GLAM_GALLERY[2].src}
                  alt={GLAM_GALLERY[2].alt}
                  width={1200}
                  height={1500}
                  quality={100}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 48vw, 28vw"
                  className="h-full w-full object-cover object-[50%_13%]"
                />
              </div>

              <div className="h-[9.5rem] sm:h-[10.75rem] lg:h-[11.5rem] overflow-hidden rounded-[1.75rem] border border-[#ead8cc] bg-white/75 shadow-[0_24px_60px_-42px_rgba(63,34,21,0.32)] dark:border-[#4a342c] dark:bg-[#201412] dark:shadow-[0_24px_60px_-42px_rgba(0,0,0,0.74)]">
                <Image
                  src={GLAM_GALLERY[3].src}
                  alt={GLAM_GALLERY[3].alt}
                  width={1200}
                  height={1500}
                  quality={100}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 48vw, 28vw"
                  className="h-full w-full object-cover object-[52%_26%]"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 pt-1">
            <ThemeCtaLink
              href="/kontakt"
              label="Rezerviši glam termin"
              lightClassName={lightCtaClassName}
              darkClassName={darkCtaClassName}
            />
            <p className="text-sm font-medium text-[#7a6155] dark:text-[#e4d0c6]">{GLAM_BENEFITS[0]}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
            <div className="h-[10rem] sm:h-[11rem] lg:h-[12rem] overflow-hidden rounded-[1.9rem] border border-[#ead8cc] bg-white/75 shadow-[0_24px_62px_-42px_rgba(63,34,21,0.32)] dark:border-[#4a342c] dark:bg-[#201412] dark:shadow-[0_24px_62px_-42px_rgba(0,0,0,0.74)]">
              <Image
                src={GLAM_GALLERY[4].src}
                alt={GLAM_GALLERY[4].alt}
                width={1400}
                height={1100}
                quality={100}
                sizes="(max-width: 1024px) 100vw, 30vw"
                className="h-full w-full object-cover object-[50%_25%]"
              />
            </div>

            <div className="relative h-[10rem] sm:h-[11rem] lg:h-[12rem] overflow-hidden rounded-[1.9rem] border border-[#ead8cc] bg-white/75 shadow-[0_26px_68px_-42px_rgba(60,31,18,0.34)] dark:border-[#4a342c] dark:bg-[#201412] dark:shadow-[0_26px_68px_-42px_rgba(0,0,0,0.78)]">
              <Image
                src={GLAM_GALLERY[5].src}
                alt={GLAM_GALLERY[5].alt}
                width={1600}
                height={900}
                quality={100}
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(31,20,17,0)_0%,rgba(31,20,17,0.12)_52%,rgba(31,20,17,0.62)_100%)] dark:bg-[linear-gradient(180deg,rgba(18,12,10,0)_0%,rgba(18,12,10,0.18)_52%,rgba(18,12,10,0.72)_100%)]" />
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
                <div className="max-w-[22rem] rounded-[1.3rem] border border-white/18 bg-white/12 px-4 py-3 text-white shadow-[0_20px_45px_-28px_rgba(0,0,0,0.55)] backdrop-blur-md dark:border-white/12 dark:bg-white/10">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#f0cab5]">Glam Style</p>
                  <p className="mt-1 text-sm leading-6">
                    Mekan glow, definisan pogled i luksuzan finiš koji izgleda moćno uživo i na fotografijama.
                  </p>
                </div>
                <Sparkles className="mb-1 size-8 shrink-0 text-white/85" />
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
