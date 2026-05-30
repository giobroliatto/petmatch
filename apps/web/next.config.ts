import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {},
};

export const metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
  title: {
    default: 'PetMatch BC — Serviços para pets em Balneário Camboriú',
    template: '%s | PetMatch BC',
  },
  description:
    'Encontre prestadores verificados de banho, passeio, veterinário e mais em Balneário Camboriú com busca inteligente por IA.',
  openGraph: {
    siteName: 'PetMatch BC',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default nextConfig;
