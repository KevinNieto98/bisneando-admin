type ValidCategory =
  | 'technology'
  | 'appliances'
  | 'home'
  | 'fashion'
  | 'beauty'
  | 'sports'
  | 'toys'
  | 'groceries'
  | 'automotive'
  | 'office';

// Subcategorías (extiende libremente según necesites)
type ValidSubcategory =
  | 'smart-home'
  | 'security-cameras'
  | 'smart-plugs'
  | 'smart-lighting'
  | 'smart-speakers'
  | 'audio'
  | 'computers'
  | 'phones'
  | 'accessories';

// Producto base genérico para el seed
interface SeedProduct {
  id_producto: number;
  title: string;
  description: string;
  images: string[];            // nombres de archivo o paths
  inStock: number;             // QTY
  price: number;               // Precio (en tu moneda base)
  slug: string;                // nombre + id (kebab-case)
  tags: string[];              // palabras clave para búsqueda/filtros
  isActive: boolean;           // Activo
  category: ValidCategory;     // p.ej. 'technology'
  subcategory?: ValidSubcategory; // p.ej. 'smart-speakers'
  brand?: string;              // p.ej. 'Amazon', 'Roku', 'Linkind'
  specs?: Record<string, string | number | boolean>; // atributos libres
}

interface SeedData {
  products: SeedProduct[];
}


export const initialData: SeedData = {
  products: [
    {
      id_producto: 1,
      title: 'Roku Indoor Camera  WiFi',
      description:
        'Cámara de seguridad con resolución Full HD 1080p y visión nocturna en color. Compatible con Alexa y Google, detección de movimiento y sonido, ideal para monitoreo del hogar y mascotas.',
      images: ['Roku-Indoor-Camera--WiFi.jpg', 'Roku-Indoor-Camera--WiFi_2.jpg'],
      inStock: 4,
      price: 1185,
      slug: 'roku-indoor-camera-wifi-1',
      tags: ['tecnologia', 'cámara', 'seguridad', 'alexa', 'google'],
      isActive: true,
      category: 'technology',
      subcategory: 'security-cameras',
      brand: 'Roku',
      specs: { resolution: '1080p', nightVision: true, wifi: '2.4GHz' },
    },
    {
      id_producto: 2,
      title: 'Linkind Matter Smart Plug',
      description:
        'Enchufe inteligente compatible con Apple Home, Siri, Alexa, Google y SmartThings. Control remoto por app, temporizador y programación, soporta hasta 15A/1800W, conexión Wi-Fi 2.4GHz.',
      images: ['Linkind-Matter-Smart-Plug.jpg', 'Linkind-Matter-Smart-Plug_2.jpg'],
      inStock: 43,
      price: 380,
      slug: 'linkind-matter-smart-plug-2',
      tags: ['tecnologia', 'enchufe', 'smart-home', 'alexa', 'google', 'homekit', 'matter'],
      isActive: true,
      category: 'technology',
      subcategory: 'smart-plugs',
      brand: 'Linkind',
      specs: { standard: 'Matter', maxPowerW: 1800, wifi: '2.4GHz' },
    },
    {
      id_producto: 3,
      title: 'Amazon Basics Smart A19 LED Light Bulb',
      description:
        'Foco LED inteligente de 9W (equivalente a 60W) con cambio de color y 800 lúmenes. Funciona solo con Alexa, conexión Wi-Fi 2.4GHz, sin necesidad de hub.',
      images: ['Amazon-Basics-Smart-A19-LED-Light-Bulb.jpg', 'Amazon-Basics-Smart-A19-LED-Light-Bulb_2.jpg'],
      inStock: 2,
      price: 490,
      slug: 'amazon-basics-smart-a19-led-light-bulb-3',
      tags: ['tecnologia', 'foco', 'led', 'rgb', 'alexa', 'wifi'],
      isActive: true,
      category: 'technology',
      subcategory: 'smart-lighting',
      brand: 'Amazon Basics',
      specs: { watts: 9, lumens: 800, socket: 'A19', wifi: '2.4GHz' },
    },
    {
      id_producto: 4,
      title: 'Linkind Smart Light Bulbs',
      description:
        'Foco LED inteligente con cambio de color, 104 escenas preestablecidas y sincronización con música. Compatible con Alexa y Google Home, 800 lúmenes, conexión Wi-Fi 2.4GHz y Bluetooth.',
      images: ['Linkind-Smart-Light-Bulb.jpg', 'Linkind-Smart-Light-Bulb_2.jpg'],
      inStock: 4,
      price: 350,
      slug: 'linkind-smart-light-bulbs-4',
      tags: ['tecnologia', 'foco', 'rgb', 'alexa', 'google', 'bluetooth'],
      isActive: true,
      category: 'technology',
      subcategory: 'smart-lighting',
      brand: 'Linkind',
      specs: { lumens: 800, wifi: '2.4GHz', bluetooth: true, scenes: 104 },
    },
    {
      id_producto: 5,
      title: 'Amazon Echo Dot',
      description:
        'Altavoz inteligente compacto con Alexa integrada. Disfruta de sonido nítido, controla tu hogar inteligente, haz preguntas, reproduce música y recibe información al instante, todo con comandos de voz.',
      images: ['Amazon-Echo-Dot.jpg', 'Amazon-Echo-Dot_2.jpg'],
      inStock: 2,
      price: 1850,
      slug: 'amazon-echo-dot-5',
      tags: ['tecnologia', 'altavoz', 'alexa', 'smart-speaker'],
      isActive: true,
      category: 'technology',
      subcategory: 'smart-speakers',
      brand: 'Amazon',
      specs: { voiceAssistant: 'Alexa', wifi: true, bt: true },
    },
    {
      id_producto: 6,
      title: 'Amazon Echo Pop',
      description:
        'Altavoz inteligente con diseño moderno y sonido de calidad. Controla dispositivos, escucha música, obtén noticias y realiza tareas con solo usar tu voz gracias a Alexa.',
      images: ['Amazon-Echo-Pop_2.jpg', 'Amazon-Echo-Pop_3.jpg'],
      inStock: 2,
      price: 1480,
      slug: 'amazon-echo-pop-6',
      tags: ['tecnologia', 'altavoz', 'alexa', 'smart-speaker'],
      isActive: true,
      category: 'technology',
      subcategory: 'smart-speakers',
      brand: 'Amazon',
      specs: { voiceAssistant: 'Alexa', wifi: true, bt: true },
    },
  ],
};
