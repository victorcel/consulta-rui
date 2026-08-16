import { FAQ_RUI } from './rui-faq';
import { SITE_URL } from './site';

/**
 * Schema exclusivo de la portada: el FAQ y los pasos de consulta sólo son
 * visibles ahí. Google exige que el contenido declarado en el schema esté
 * presente en la página, así que no puede vivir en el layout raíz —heredarlo
 * en las páginas de contenido rompería esa correspondencia.
 */
export const homeJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}#faq`,
      mainEntity: FAQ_RUI.map((item) => ({
        '@type': 'Question',
        name: item.pregunta,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.respuesta,
        },
      })),
    },
    {
      '@type': 'HowTo',
      '@id': `${SITE_URL}#howto`,
      name: 'Cómo consultar el RUI por cédula',
      description:
        'Pasos para consultar tu grupo y clasificación en el Registro Universal de Ingresos (RUI) con el número de documento.',
      inLanguage: 'es-CO',
      totalTime: 'PT3M',
      estimatedCost: {
        '@type': 'MonetaryAmount',
        currency: 'COP',
        value: '0',
      },
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Selecciona el tipo de documento',
          text: 'Elige tu tipo de documento de identidad: cédula de ciudadanía, tarjeta de identidad, cédula de extranjería u otro.',
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Escribe el número de documento',
          text: 'Ingresa el número de tu documento sin puntos ni comas.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Completa la validación de seguridad',
          text: 'Resuelve la verificación que confirma que no eres un robot.',
        },
        {
          '@type': 'HowToStep',
          position: 4,
          name: 'Consulta tu clasificación',
          text: 'Presiona Consultar RUI para ver tu grupo y subgrupo en el Registro Universal de Ingresos.',
        },
      ],
    },
  ],
};
