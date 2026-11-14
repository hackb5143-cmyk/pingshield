import { Metadata } from 'next';
import DemoClient from './DemoClient';

export const metadata: Metadata = {
  title: 'PingShield — Demo QR Code Generator',
  description: 'Instant scannable QR code for PingShield hackathon demo item.',
};

export default function DemoPage() {
  return <DemoClient />;
}
