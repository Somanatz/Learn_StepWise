// src/components/shared/Logo.tsx
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <Link href="/" className={`flex items-center group ${className}`} style={{ minHeight: '60px' }}>
      <Image
        src="/images/Genai.png" // Updated path to new logo
        alt="GenAI-Campus Logo" // Updated alt text
        width={218}
        height={60}
        priority
        className="group-hover:opacity-90 transition-opacity duration-200"
      />
    </Link>
  );
};

export default Logo;
