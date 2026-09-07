import Link from "next/link";
import { Lock } from "lucide-react";
import { LegalPage } from "@/components/landing/LegalPage";
import { getStaticI18n } from "@/lib/i18n/server";
import { BRAND } from "@/lib/brand";

export const revalidate = 120;

export const metadata = {
  title: "Política de privacidad | Enquiva",
  description:
    "Cómo Enquiva recopila, usa y protege tu información personal, tus datos de pago y tu actividad en la plataforma.",
};

export default async function PrivacyPage() {
  const { locale } = await getStaticI18n();
  const isEn = locale === "en";
  const name = BRAND.name;

  return (
    <LegalPage
      badge={isEn ? "Privacy" : "Privacidad"}
      badgeIcon={Lock}
      title={isEn ? "Privacy" : "Política de"}
      titleHighlight={isEn ? "Policy" : "Privacidad"}
      updatedLabel={isEn ? "Last updated:" : "Última actualización:"}
      updatedDate={isEn ? "September 7, 2026" : "7 de septiembre de 2026"}
      intro={
        isEn ? (
          <>
            This Privacy Policy explains how {name} collects, uses, stores and protects your
            personal information when you use the platform. We take your privacy seriously.
          </>
        ) : (
          <>
            Esta Política de Privacidad explica cómo {name} recopila, usa, almacena y protege tu
            información personal cuando usas la plataforma. Nos tomamos tu privacidad en serio.
          </>
        )
      }
      sections={
        isEn
          ? EN_SECTIONS
          : ES_SECTIONS(name)
      }
    />
  );
}

function ES_SECTIONS(name: string) {
  return [
    {
      heading: "1. Información que recopilamos",
      paragraphs: [
        <>Recopilamos la información que nos proporcionas directamente, como tu nombre, correo electrónico y datos de contacto al crear una cuenta o inscribirte.</>,
      ],
      list: [
        <>Datos de cuenta: nombre, correo electrónico y preferencias.</>,
        <>Datos de inscripción y pago: información necesaria para procesar tu compra de entradas.</>,
        <>Datos técnicos: dirección IP, tipo de navegador y registros de actividad para mejorar el servicio y la seguridad.</>,
      ],
    },
    {
      heading: "2. Uso de la información",
      paragraphs: [
        <>Utilizamos tu información para prestar los servicios de la plataforma, procesar inscripciones y pagos, enviarte comunicaciones relevantes y mejorar tu experiencia.</>,
      ],
      list: [
        <>Gestionar tu cuenta, eventos e inscripciones.</>,
        <>Procesar pagos y emitir tickets.</>,
        <>Enviarte notificaciones sobre eventos a los que te has inscrito.</>,
        <>Enviarte el boletín de novedades si te suscribes (puedes darte de baja en cualquier momento).</>,
        <>Garantizar la seguridad y prevenir fraudes o usos abusivos.</>,
      ],
    },
    {
      heading: "3. Compartir información",
      paragraphs: [
        <>No vendemos tu información personal a terceros. Podemos compartirla únicamente en los siguientes casos:</>,
      ],
      list: [
        <>Con los organizadores de los eventos a los que te inscribes, para la gestión del evento.</>,
        <>Con proveedores de pago y servicios técnicos necesarios para el funcionamiento de la plataforma.</>,
        <>Cuando la ley lo exija o para proteger derechos legales.</>,
      ],
    },
    {
      heading: "4. Seguridad de los datos",
      paragraphs: [
        <>Implementamos medidas técnicas y organizativas razonables para proteger tu información contra acceso no autorizado, pérdida o alteración. Los pagos se procesan a través de pasarelas seguras.</>,
      ],
    },
    {
      heading: "5. Cookies y tecnologías similares",
      paragraphs: [
        <>Usamos cookies para recordar tu sesión, preferencias de idioma y tema, y para entender cómo se usa la plataforma. Puedes configurar tu navegador para rechazarlas, aunque algunas funciones podrían verse afectadas.</>,
      ],
    },
    {
      heading: "6. Tus derechos",
      paragraphs: [
        <>Tienes derecho a acceder, corregir o eliminar tu información personal, y a oponerte al tratamiento de la misma en los casos previstos por la ley.</>,
      ],
      list: [
        <>Acceder a los datos que tenemos sobre ti.</>,
        <>Solicitar la corrección de datos inexactos.</>,
        <>Solicitar la eliminación de tu cuenta y datos.</>,
        <>Darte de baja del boletín en cualquier momento.</>,
      ],
    },
    {
      heading: "7. Retención de datos",
      paragraphs: [
        <>Conservamos tu información únicamente durante el tiempo necesario para las finalidades descritas en esta política y para cumplir con obligaciones legales.</>,
      ],
    },
    {
      heading: "8. Cambios en esta política",
      paragraphs: [
        <>Podemos actualizar esta Política de Privacidad. Publicaremos la versión vigente en esta página y te notificaremos los cambios relevantes.</>,
      ],
    },
    {
      heading: "9. Contacto",
      paragraphs: [
        <>Para consultas sobre privacidad, contáctanos a través de nuestra página de <Link href="/contact" className="font-semibold text-primary hover:underline">contacto</Link> o escribiendo a soporte@enquiva.site.</>,
      ],
    },
  ];
}

const EN_SECTIONS = [
  {
    heading: "1. Information we collect",
    paragraphs: [
      <>We collect information you provide directly, such as your name, email address and contact details when creating an account or registering.</>,
    ],
    list: [
      <>Account data: name, email address and preferences.</>,
      <>Registration and payment data: information needed to process your ticket purchase.</>,
      <>Technical data: IP address, browser type and activity logs to improve service and security.</>,
    ],
  },
  {
    heading: "2. How we use information",
    paragraphs: [
      <>We use your information to provide the platform services, process registrations and payments, send relevant communications and improve your experience.</>,
    ],
    list: [
      <>Manage your account, events and registrations.</>,
      <>Process payments and issue tickets.</>,
      <>Send you notifications about events you have registered for.</>,
      <>Send you the newsletter if you subscribe (you may unsubscribe at any time).</>,
      <>Ensure security and prevent fraud or abusive use.</>,
    ],
  },
  {
    heading: "3. Sharing information",
    paragraphs: [
      <>We do not sell your personal information to third parties. We may share it only in the following cases:</>,
    ],
    list: [
      <>With the organizers of the events you register for, to manage the event.</>,
      <>With payment providers and technical services necessary for the platform to function.</>,
      <>When required by law or to protect legal rights.</>,
    ],
  },
  {
    heading: "4. Data security",
    paragraphs: [
      <>We implement reasonable technical and organizational measures to protect your information from unauthorized access, loss or alteration. Payments are processed through secure gateways.</>,
    ],
  },
  {
    heading: "5. Cookies and similar technologies",
    paragraphs: [
      <>We use cookies to remember your session, language and theme preferences, and to understand how the platform is used. You can configure your browser to reject them, although some features may be affected.</>,
    ],
  },
  {
    heading: "6. Your rights",
    paragraphs: [
      <>You have the right to access, correct or delete your personal information, and to object to its processing where provided by law.</>,
    ],
    list: [
      <>Access the data we hold about you.</>,
      <>Request correction of inaccurate data.</>,
      <>Request deletion of your account and data.</>,
      <>Unsubscribe from the newsletter at any time.</>,
    ],
  },
  {
    heading: "7. Data retention",
    paragraphs: [
      <>We retain your information only for as long as necessary for the purposes described in this policy and to comply with legal obligations.</>,
    ],
  },
  {
    heading: "8. Changes to this policy",
    paragraphs: [
      <>We may update this Privacy Policy. We will publish the current version on this page and notify you of relevant changes.</>,
    ],
  },
  {
    heading: "9. Contact",
    paragraphs: [
      <>
        For privacy questions, contact us through our{" "}
        <Link href="/contact" className="font-semibold text-primary hover:underline">
          contact page
        </Link>{" "}
        or write to support@enquiva.site.
      </>,
    ],
  },
];
