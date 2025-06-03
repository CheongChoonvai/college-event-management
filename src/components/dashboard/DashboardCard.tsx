import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

interface DashboardCardProps {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  action?: React.ReactNode;
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  footer,
  action,
  href,
  children,
  className = '',
}) => {
  const CardComponent = () => (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {action && <div>{action}</div>}
        </div>
      </CardHeader>
      <CardContent className="flex-grow py-4">{children}</CardContent>
      {footer && <CardFooter className="pt-0 border-t">{footer}</CardFooter>}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        <CardComponent />
      </Link>
    );
  }

  return <CardComponent />;
};

export default DashboardCard;
