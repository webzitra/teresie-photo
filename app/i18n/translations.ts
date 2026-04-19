export type Lang = "cs" | "en";

type Package = {
  name: string;
  price: string;
  highlight: boolean;
  image: string;
  features: string[];
};

type OtherService = {
  name: string;
  price: string;
  image: string;
  desc: string;
};

type Stat = { value: string; label: string };

export type Translation = {
  nav: {
    about: string;
    services: string;
    portfolio: string;
    contact: string;
    booking: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  about: {
    eyebrow: string;
    title: string;
    lead: string;
    paragraphs: string[];
    stats: Stat[];
  };
  services: {
    eyebrow: string;
    title: string;
    lead: string;
    weddingTitle: string;
    otherTitle: string;
    currency: string;
    bookCta: string;
    packages: Package[];
    others: OtherService[];
    note: string;
  };
  portfolio: {
    eyebrow: string;
    title: string;
    lead: string;
    categories: {
      all: string;
      weddings: string;
      couples: string;
      portraits: string;
      family: string;
    };
  };
  contact: {
    eyebrow: string;
    title: string;
    lead: string;
    form: {
      name: string;
      email: string;
      phone: string;
      type: string;
      typeOptions: string[];
      date: string;
      message: string;
      messagePlaceholder: string;
      submit: string;
      success: string;
    };
    info: {
      cityLabel: string;
      city: string;
      emailLabel: string;
      phoneLabel: string;
    };
  };
  footer: {
    tagline: string;
    rights: string;
    madeBy: string;
  };
};

export const translations: Record<Lang, Translation> = {
  cs: {
    nav: {
      about: "O mně",
      services: "Služby",
      portfolio: "Portfolio",
      contact: "Kontakt",
      booking: "Rezervace",
    },
    hero: {
      eyebrow: "Svatební a portrétní fotografie",
      title: "Okamžiky, které zůstanou navždy",
      subtitle:
        "Jsem Terezie Flašková a fotím lásku, emoce a životní příběhy v Českých Budějovicích a po celé ČR.",
      ctaPrimary: "Zarezervovat focení",
      ctaSecondary: "Prohlédnout portfolio",
    },
    about: {
      eyebrow: "O mně",
      title: "Příběh za objektivem",
      lead: "Fotografie pro mě není jen řemeslo — je to způsob, jak zastavit čas.",
      paragraphs: [
        "Jmenuji se Terezie a fotografování je moje srdcová záležitost. Specializuji se na svatby, párové a portrétní focení, protože mě fascinuje zachycovat opravdové emoce — pohledy, doteky, smích i slzy štěstí.",
        "Pracuji s přirozeným světlem a důrazem na atmosféru. Před objektivem se u mě nemusíte stylizovat — moje role je vytvořit prostor, kde můžete být sami sebou. Výsledkem jsou fotky, které vás vrátí přesně do toho okamžiku, i za dvacet let.",
        "Působím v Českých Budějovicích, ale ráda za vámi vyrazím kamkoliv — od jihočeských zámků přes Prahu až po Vysočinu.",
      ],
      stats: [
        { value: "120+", label: "vyfocených svateb" },
        { value: "6 let", label: "praxe" },
        { value: "100%", label: "originálních příběhů" },
      ],
    },
    services: {
      eyebrow: "Ceník",
      title: "Balíčky a služby",
      lead: "Vyberte si balíček, který vám sedí. Vše se dá doladit na míru.",
      weddingTitle: "Svatební balíčky",
      otherTitle: "Párové, portrétní a rodinné focení",
      currency: "Kč",
      bookCta: "Rezervovat",
      packages: [
        {
          name: "Bronze",
          price: "11 000",
          highlight: false,
          image: "/photos/packages/bronze.jpg",
          features: [
            "Svatební obřad",
            "Skupinové fotografie",
            "Párové focení po obřadu",
            "100 – 300 upravených fotografií",
            "Dárkové balení",
          ],
        },
        {
          name: "Silver",
          price: "16 000",
          highlight: false,
          image: "/photos/packages/silver.jpg",
          features: [
            "Obřad + skupinové fotky",
            "Hostina a krájení dortu",
            "Párové focení",
            "300 – 450 upravených fotografií",
            "Dárkové balení",
          ],
        },
        {
          name: "Gold",
          price: "21 000",
          highlight: true,
          image: "/photos/packages/gold.jpg",
          features: [
            "Přípravy nevěsty i ženicha",
            "Obřad, hostina, krájení dortu",
            "Párové focení + hod kyticí",
            "Novomanželský tanec",
            "450 – 600 fotografií",
            "Půjčená Instax zdarma",
          ],
        },
        {
          name: "Platinum",
          price: "27 000",
          highlight: false,
          image: "/photos/packages/platinum.jpg",
          features: [
            "Vše z balíčku Gold",
            "Večerní zábava + tanec s prskavkami",
            "Druhý fotograf + fotokoutek",
            "600 – 900 fotografií",
            "Prémiové dárkové balení",
          ],
        },
      ],
      others: [
        {
          name: "Portréty",
          price: "1 500",
          image: "/photos/packages/portraits.jpg",
          desc: "Venkovní focení od 15 upravených fotografií. Ideální pro modeling, profil nebo dárek.",
        },
        {
          name: "Párové focení",
          price: "2 500",
          image: "/photos/packages/couples.jpg",
          desc: "Romantické focení v exteriéru, minimálně 30 fotografií. Skvělý dárek nebo memento.",
        },
        {
          name: "Rodinné focení",
          price: "3 500",
          image: "/photos/packages/family.jpg",
          desc: "Venkovní focení rodiny, minimálně 50 fotografií. Pro malé i velké rodiny.",
        },
      ],
      note: "Možné focení i v ateliéru. Individuální podmínky a větší produkce po domluvě.",
    },
    portfolio: {
      eyebrow: "Portfolio",
      title: "Vybrané práce",
      lead: "Náhled do mých posledních svateb, párových a portrétních focení.",
      categories: {
        all: "Vše",
        weddings: "Svatby",
        couples: "Páry",
        portraits: "Portréty",
        family: "Rodina",
      },
    },
    contact: {
      eyebrow: "Kontakt",
      title: "Pojďme se domluvit",
      lead: "Napište mi, co plánujete — odpovím obvykle do 24 hodin.",
      form: {
        name: "Jméno",
        email: "E-mail",
        phone: "Telefon",
        type: "Typ focení",
        typeOptions: ["Svatba", "Pár", "Portrét", "Rodina", "Jiné"],
        date: "Plánovaný termín",
        message: "Zpráva",
        messagePlaceholder: "Napište mi pár slov o vaší představě…",
        submit: "Odeslat poptávku",
        success: "Děkuji! Ozvu se vám co nejdříve.",
      },
      info: {
        cityLabel: "Město",
        city: "České Budějovice",
        emailLabel: "E-mail",
        phoneLabel: "Telefon",
      },
    },
    footer: {
      tagline: "Svatební a portrétní fotografie z Jižních Čech",
      rights: "Všechna práva vyhrazena",
      madeBy: "Web vytvořila",
    },
  },
  en: {
    nav: {
      about: "About",
      services: "Services",
      portfolio: "Portfolio",
      contact: "Contact",
      booking: "Booking",
    },
    hero: {
      eyebrow: "Wedding & portrait photography",
      title: "Moments that stay forever",
      subtitle:
        "I'm Terezie Flašková and I photograph love, emotions and life stories in České Budějovice and across the Czech Republic.",
      ctaPrimary: "Book a session",
      ctaSecondary: "View portfolio",
    },
    about: {
      eyebrow: "About",
      title: "The story behind the lens",
      lead: "Photography is more than a craft to me — it's a way to pause time.",
      paragraphs: [
        "I'm Terezie and photography is my heart's calling. I specialize in weddings, couples and portraits because I love capturing real emotions — glances, touches, laughter and happy tears.",
        "I work with natural light and a focus on atmosphere. You don't need to pose for the camera — my job is to create space where you can simply be yourselves. The result is photos that take you right back to the moment, even twenty years later.",
        "I'm based in České Budějovice but happily travel anywhere — from South Bohemian castles through Prague to the Czech Highlands.",
      ],
      stats: [
        { value: "120+", label: "weddings shot" },
        { value: "6 yrs", label: "experience" },
        { value: "100%", label: "original stories" },
      ],
    },
    services: {
      eyebrow: "Pricing",
      title: "Packages & services",
      lead: "Pick the package that fits you. Everything can be tailored.",
      weddingTitle: "Wedding packages",
      otherTitle: "Couples, portraits & family",
      currency: "CZK",
      bookCta: "Book",
      packages: [
        {
          name: "Bronze",
          price: "11,000",
          highlight: false,
          image: "/photos/packages/bronze.jpg",
          features: [
            "Wedding ceremony",
            "Group photos",
            "Couple session after ceremony",
            "100 – 300 edited photos",
            "Gift packaging",
          ],
        },
        {
          name: "Silver",
          price: "16,000",
          highlight: false,
          image: "/photos/packages/silver.jpg",
          features: [
            "Ceremony + group photos",
            "Reception & cake cutting",
            "Couple session",
            "300 – 450 edited photos",
            "Gift packaging",
          ],
        },
        {
          name: "Gold",
          price: "21,000",
          highlight: true,
          image: "/photos/packages/gold.jpg",
          features: [
            "Bride & groom preparations",
            "Ceremony, reception, cake",
            "Couple session + bouquet toss",
            "First dance",
            "450 – 600 photos",
            "Free Instax rental",
          ],
        },
        {
          name: "Platinum",
          price: "27,000",
          highlight: false,
          image: "/photos/packages/platinum.jpg",
          features: [
            "Everything in Gold",
            "Evening party + sparkler dance",
            "Second photographer + photo booth",
            "600 – 900 photos",
            "Premium gift packaging",
          ],
        },
      ],
      others: [
        {
          name: "Portraits",
          price: "1,500",
          image: "/photos/packages/portraits.jpg",
          desc: "Outdoor session from 15 edited photos. Great for modeling, profiles or gifts.",
        },
        {
          name: "Couples",
          price: "2,500",
          image: "/photos/packages/couples.jpg",
          desc: "Romantic outdoor session, at least 30 photos. A wonderful gift or keepsake.",
        },
        {
          name: "Family",
          price: "3,500",
          image: "/photos/packages/family.jpg",
          desc: "Outdoor family session, at least 50 photos. For families big and small.",
        },
      ],
      note: "Studio sessions available. Custom terms and larger productions on request.",
    },
    portfolio: {
      eyebrow: "Portfolio",
      title: "Selected work",
      lead: "A glimpse into my recent weddings, couples and portrait sessions.",
      categories: {
        all: "All",
        weddings: "Weddings",
        couples: "Couples",
        portraits: "Portraits",
        family: "Family",
      },
    },
    contact: {
      eyebrow: "Contact",
      title: "Let's talk",
      lead: "Tell me what you're planning — I usually reply within 24 hours.",
      form: {
        name: "Name",
        email: "Email",
        phone: "Phone",
        type: "Session type",
        typeOptions: ["Wedding", "Couple", "Portrait", "Family", "Other"],
        date: "Preferred date",
        message: "Message",
        messagePlaceholder: "Tell me a few words about your vision…",
        submit: "Send inquiry",
        success: "Thank you! I'll get back to you shortly.",
      },
      info: {
        cityLabel: "City",
        city: "České Budějovice",
        emailLabel: "Email",
        phoneLabel: "Phone",
      },
    },
    footer: {
      tagline: "Wedding & portrait photography from South Bohemia",
      rights: "All rights reserved",
      madeBy: "Website by",
    },
  },
};
