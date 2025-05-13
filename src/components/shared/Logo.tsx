import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '', iconSize = 32, textSize = "text-2xl" }) => {
  return (
    <Link href="/" className={`flex items-center gap-2 group ${className}`} style={{ minHeight: '48px' }}>
      <GraduationCap size={iconSize} className="text-primary group-hover:text-accent transition-colors" />
      <span className={`font-poppins font-bold ${textSize} text-foreground group-hover:text-accent transition-colors`}>
        StepWise
      </span>
    </Link>
  );
};

export default Logo;
