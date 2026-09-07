import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { LegalPage } from "@/components/landing/LegalPage";
import { getStaticI18n } from "@/lib/i18n/server";
import { BRAND } from "@/lib/brand";

export const revalidate = 120;

export const metadata = {
  title: "Términos y condiciones | Enquiva",
  description:
    "Términos y condiciones de uso de la plataforma Enquiva: cuentas, eventos, pagos, tickets y responsabilidades.",
};

export default async function TermsPage() {
  const { locale } = await getStaticI18n();
  const isEn = locale === "en";
  const name = BRAND.name;

  const brand = <strong className="text-foreground">{name}</strong>;

  return (
    <LegalPage
      badge={isEn ? "Legal" : "Legal"}
      badgeIcon={ShieldCheck}
      title={isEn ? "Terms and" : "Términos y"}
      titleHighlight={isEn ? "Conditions" : "Condiciones"}
      updatedLabel={isEn ? "Last updated:" : "Última actualización:"}
      updatedDate={isEn ? "September 7, 2026" : "7 de septiembre de 2026"}
      intro={
        isEn ? (
          <>
            Welcome to {name}. These Terms and Conditions govern your access to and use of the
            {brand} platform, including event browsing, registration, ticket purchase and creation
            of events. By using the platform you agree to these terms.
          </>
        ) : (
          <>
            Bienvenido a {name}. Estos Términos y Condiciones rigen tu acceso y uso de la plataforma
            {brand}, incluyendo la exploración de eventos, inscripciones, compra de entradas y la
            creación de eventos. Al usar la plataforma aceptas estos términos.
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
      heading: "1. Aceptación de los términos",
      paragraphs: [
        <>Al acceder o utilizar la plataforma <strong className="text-foreground">{name}</strong>, confirmas que has leído, entendido y aceptado estos Términos y Condiciones. Si no estás de acuerdo, por favor no uses la plataforma.</>,
      ],
    },
    {
      heading: "2. Cuentas de usuario",
      paragraphs: [
        <>Para inscribirte en eventos u organizarlos, debes crear una cuenta con información veraz y actualizada. Eres responsable de mantener la confidencialidad de tus credenciales y de toda la actividad que ocurra en tu cuenta.</>,
      ],
      list: [
        <>Debes tener al menos 18 años para crear una cuenta de organizador.</>,
        <>Debes proporcionar un correo electrónico válido.</>,
        <>Notifica de inmediato cualquier uso no autorizado de tu cuenta.</>,
      ],
    },
    {
      heading: "3. Uso de la plataforma",
      paragraphs: [
        <>Te comprometes a usar la plataforma únicamente con fines legítimos y de acuerdo con la ley aplicable. Queda prohibido cualquier uso que pueda dañar, sobrecargar o interferir con el funcionamiento de la plataforma o de terceros.</>,
      ],
    },
    {
      heading: "4. Eventos e inscripciones",
      paragraphs: [
        <>Los organizadores publican eventos en la plataforma bajo su propia responsabilidad. {name} actúa como intermediario tecnológico y no garantiza la realización del evento.</>,
        <>Al inscribirte, el cupo queda reservado según las condiciones del evento. La confirmación de asistencia puede requerir la emisión de un ticket.</>,
      ],
    },
    {
      heading: "5. Pagos y reembolsos",
      paragraphs: [
        <>Los pagos de inscripciones se procesan de forma segura a través de proveedores de pago habilitados. La política de reembolso de cada evento es establecida por su organizador y debe ser consultada antes de completar la compra.</>,
      ],
    },
    {
      heading: "6. Tickets y check-in",
      paragraphs: [
        <>El ticket QR emitido es el comprobante de acceso al evento. Es de uso personal e intransferible salvo que el organizador indique lo contrario. El personal de acceso puede validar el ticket mediante escaneo en el momento del ingreso.</>,
      ],
    },
    {
      heading: "7. Propiedad intelectual",
      paragraphs: [
        <>Todos los contenidos, marcas, logotipos y diseños de la plataforma son propiedad de {name} o de sus licenciantes y están protegidos por las leyes de propiedad intelectual. No se permite su reproducción sin autorización.</>,
      ],
    },
    {
      heading: "8. Limitación de responsabilidad",
      paragraphs: [
        <>En la medida máxima permitida por la ley, {name} no será responsable por daños indirectos, incidentales o consecuentes derivados del uso de la plataforma o de la asistencia a eventos organizados por terceros.</>,
      ],
    },
    {
      heading: "9. Modificaciones",
      paragraphs: [
        <>Podemos actualizar estos Términos y Condiciones en cualquier momento. La versión vigente estará publicada en esta página, y el uso continuado de la plataforma tras los cambios implica su aceptación.</>,
      ],
    },
    {
      heading: "10. Contacto",
      paragraphs: [
        <>Si tienes preguntas sobre estos términos, contáctanos a través de nuestra página de <Link href="/contact" className="font-semibold text-primary hover:underline">contacto</Link> o escribiendo a soporte@enquiva.site.</>,
      ],
    },
  ];
}

const EN_SECTIONS = [
  {
    heading: "1. Acceptance of terms",
    paragraphs: [
      <>By accessing or using the platform, you confirm that you have read, understood and accepted these Terms and Conditions. If you do not agree, please do not use the platform.</>,
    ],
  },
  {
    heading: "2. User accounts",
    paragraphs: [
      <>To register for events or organize them, you must create an account with truthful and current information. You are responsible for keeping your credentials confidential and for all activity that occurs under your account.</>,
    ],
    list: [
      <>You must be at least 18 years old to create an organizer account.</>,
      <>You must provide a valid email address.</>,
      <>Report any unauthorized use of your account immediately.</>,
    ],
  },
  {
    heading: "3. Use of the platform",
    paragraphs: [
      <>You agree to use the platform only for legitimate purposes and in accordance with applicable law. Any use that may damage, overload or interfere with the platform or third parties is prohibited.</>,
    ],
  },
  {
    heading: "4. Events and registrations",
    paragraphs: [
      <>Organizers publish events on the platform under their own responsibility. The platform acts as a technological intermediary and does not guarantee the event will take place.</>,
      <>By registering, your spot is reserved according to the event conditions. Confirmation of attendance may require the issuance of a ticket.</>,
    ],
  },
  {
    heading: "5. Payments and refunds",
    paragraphs: [
      <>Registration payments are processed securely through enabled payment providers. Each event refund policy is set by its organizer and should be reviewed before completing a purchase.</>,
    ],
  },
  {
    heading: "6. Tickets and check-in",
    paragraphs: [
      <>The issued QR ticket is proof of access to the event. It is personal and non-transferable unless the organizer states otherwise. Access staff may validate the ticket by scanning at entry.</>,
    ],
  },
  {
    heading: "7. Intellectual property",
    paragraphs: [
      <>All content, brands, logos and designs on the platform are the property of Enquiva or its licensors and are protected by intellectual property laws. Reproduction without authorization is not permitted.</>,
    ],
  },
  {
    heading: "8. Limitation of liability",
    paragraphs: [
      <>To the maximum extent permitted by law, Enquiva shall not be liable for indirect, incidental or consequential damages arising from the use of the platform or attendance at third-party events.</>,
    ],
  },
  {
    heading: "9. Changes",
    paragraphs: [
      <>We may update these Terms and Conditions at any time. The current version will be published on this page, and continued use of the platform after changes implies acceptance.</>,
    ],
  },
  {
    heading: "10. Contact",
    paragraphs: [
      <>
        If you have questions about these terms, contact us through our{" "}
        <Link href="/contact" className="font-semibold text-primary hover:underline">
          contact page
        </Link>{" "}
        or write to support@enquiva.site.
      </>,
    ],
  },
];
