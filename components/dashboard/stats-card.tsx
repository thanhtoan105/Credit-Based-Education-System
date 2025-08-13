'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down';
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  trend,
  icon,
  description,
  className
}: StatsCardProps) {
  return (
    <Card className={cn("relative overflow-hidden hover:shadow-lg transition-all duration-300", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          {change && (
            <Badge
              variant="secondary"
              className={cn(
                "text-xs font-medium",
                trend === 'up' 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              )}
            >
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {Math.abs(change)}%
            </Badge>
          )}
          {icon && (
            <div className="text-gray-400">
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}