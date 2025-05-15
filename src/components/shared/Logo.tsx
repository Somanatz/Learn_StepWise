import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <Link href="/" className={`flex items-center group ${className}`} style={{ minHeight: '60px' }}>
      <Image
        src="/images/logo.png" // Assuming you save your logo as logo.png in public/images/
        alt="Learn-StepWise Logo"
        width={218} 
        height={60}
        priority // Optional: if logo is critical for LCP
        className="group-hover:opacity-90 transition-opacity duration-200"
      />
    </Link>
  );
};

export default Logo;
