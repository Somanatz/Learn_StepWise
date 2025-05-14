import Link from 'next/link';
import { Lightbulb } from 'lucide-react';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '', iconSize = 28, textSize = "text-xl" }) => {
  return (
    <Link href="/" className={`flex items-center gap-2 group ${className}`} style={{ minHeight: '48px' }}>
      <Lightbulb size={iconSize} className="text-primary group-hover:text-accent transition-colors duration-200" />
      <div className={`${textSize} font-poppins text-foreground group-hover:text-accent transition-colors duration-200`}>
        <span className="font-medium">Learn-</span>
        <span className="font-bold">StepWise</span>
      </div>
    </Link>
  );
};

export default Logo;
